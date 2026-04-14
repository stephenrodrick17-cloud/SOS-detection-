# Deployment Guide

## Cloud Deployment Options

### 1. AWS Deployment

#### Architecture
- **Backend**: AWS Elastic Beanstalk
- **Frontend**: S3 + CloudFront
- **Database**: RDS (PostgreSQL)
- **Storage**: S3 (for uploaded images)
- **ML Inference**: EC2 for GPU (optional)

#### Setup Steps

```bash
# 1. Install AWS CLI
aws configure

# 2. Create RDS PostgreSQL database
aws rds create-db-instance \
  --db-instance-identifier damage-detection-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20

# 3. Create S3 bucket for images
aws s3 mb s3://damage-detection-uploads

# 4. Create Elastic Beanstalk environment
eb init -p python-3.10 damage-detection
eb create production

# 5. Deploy application
eb deploy

# 6. Set environment variables
eb setenv \
  DATABASE_URL=postgresql://... \
  TWILIO_ACCOUNT_SID=... \
  SENDGRID_API_KEY=...

# 7. Deploy frontend to S3
npm run build
aws s3 sync build/ s3://damage-detection-website/

# 8. Create CloudFront distribution for frontend
aws cloudfront create-distribution ...
```

#### Cost Estimation
- RDS PostgreSQL (t3.micro): $30-50/month
- Elastic Beanstalk (2 instances): $50-100/month
- S3 storage: $0.023/GB/month
- CloudFront: $0.085/GB (first 10TB)
- **Total**: ~$100-200/month

### 2. Google Cloud Deployment

#### Architecture
- **Backend**: Cloud Run
- **Frontend**: Cloud Storage + Cloud CDN
- **Database**: Cloud SQL (PostgreSQL)
- **ML**: Vertex AI (optional)

#### Setup Steps

```bash
# 1. Create GCP project
gcloud projects create damage-detection

# 2. Create Cloud SQL PostgreSQL instance
gcloud sql instances create damage-detection-db \
  --database-version POSTGRES_14 \
  --tier db-f1-micro

# 3. Create database
gcloud sql databases create infrastructure_damage

# 4. Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# 5. Build and push Docker image
docker build -t gcr.io/PROJECT_ID/damage-detection:latest .
docker push gcr.io/PROJECT_ID/damage-detection:latest

# 6. Deploy to Cloud Run
gcloud run deploy damage-detection \
  --image gcr.io/PROJECT_ID/damage-detection:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=...

# 7. Deploy frontend to Cloud Storage
gsutil -m cp -r build/* gs://damage-detection-website/

# 8. Enable Cloud CDN
gsutil uniformbucketlevelaccess set on gs://damage-detection-website/
```

#### Cost Estimation
- Cloud Run (1M requests/month): $20-50/month
- Cloud SQL (db-f1-micro): $15-25/month
- Cloud Storage: $0.020/GB/month
- Cloud CDN: $0.12/GB/month
- **Total**: ~$50-100/month

### 3. Azure Deployment

#### Architecture
- **Backend**: App Service
- **Frontend**: Static Web Apps
- **Database**: Azure Database for PostgreSQL
- **Storage**: Blob Storage

#### Setup Steps

```bash
# 1. Login to Azure
az login

# 2. Create Resource Group
az group create \
  --name damage-detection \
  --location eastus

# 3. Create PostgreSQL database
az postgres server create \
  --resource-group damage-detection \
  --name damage-detection-db \
  --admin-user admin \
  --admin-password PASSWORD

# 4. Create App Service
az appservice plan create \
  --name damage-detection-plan \
  --resource-group damage-detection \
  --sku B1 --is-linux

az webapp create \
  --resource-group damage-detection \
  --plan damage-detection-plan \
  --name damage-detection-api \
  --runtime "PYTHON|3.10"

# 5. Deploy backend
git remote add azure <deployment-url>
git push azure main

# 6. Deploy frontend to Static Web Apps
az staticwebapp create \
  --name damage-detection-frontend \
  --resource-group damage-detection \
  --source ./frontend
```

#### Cost Estimation
- App Service (B1): $11/month
- Database (scalable): $15-50/month
- Static Web Apps: Free tier available
- **Total**: ~$30-70/month

### 4. Self-Hosted (VPS)

#### Using DigitalOcean/Linode

```bash
# 1. Create Droplet (Ubuntu 20.04, 4GB RAM)
doctl compute droplet create damage-detection \
  --region nyc3 \
  --image ubuntu-20-04-x64 \
  --size s-2vcpu-4gb \
  --ssh-keys <key_id>

# 2. SSH into server
ssh root@<droplet-ip>

# 3. Install dependencies
apt-get update && apt-get upgrade -y
apt-get install -y python3.10 nodejs postgresql nginx

# 4. Clone repository
git clone https://github.com/yourusername/infrastructure-damage-detection.git
cd infrastructure-damage-detection

# 5. Setup backend with systemd
cp systemd/damage-detection.service /etc/systemd/system/
systemctl enable damage-detection
systemctl start damage-detection

# 6. Setup nginx reverse proxy
cp nginx/damage-detection.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/damage-detection.conf /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 7. Setup SSL with Let's Encrypt
certbot --nginx -d yourdomain.com

# 8. Deploy frontend
npm run build
cp -r build/* /var/www/damage-detection/
```

#### Cost Estimation
- DigitalOcean Droplet (4GB): $24/month
- Managed Database: $15-60/month
- Domain: $12-15/year
- **Total**: ~$40-85/month

## Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY backend/ .
COPY frontend/build/ ./static/

# Expose ports
EXPOSE 8000

# Run application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/database
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=database
    volumes:
      - postgres_data:/var/lib/postgresql/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          eb deploy --verbose
```

## Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Set up log aggregation
- [ ] Enable CORS with specific origins
- [ ] Rate limit API endpoints
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Set up secrets management
- [ ] Configure CDN for static files
- [ ] Set up automated health checks
- [ ] Document deployment process
- [ ] Test disaster recovery
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring

## Scaling to Production

### Database
```bash
# PostgreSQL replication
# Read replicas for scaling read operations
# Automated backups
# Connection pooling (PgBouncer)
```

### Backend
```bash
# Load balancer (Nginx, HAProxy)
# Horizontal scaling (multiple instances)
# API rate limiting
# Request caching (Redis)
# Queue for async tasks (Celery)
```

### Frontend
```bash
# CDN for static assets
# Code splitting and lazy loading
# Browser caching strategies
# Service workers for offline support
```

### ML Model
```bash
# Model serving framework (TF Serving, Seldon)
# Model versioning and rollback
# A/B testing for model updates
# Inference optimization
```

## Monitoring and Maintenance

### Health Checks
```bash
# Monitor backend health
curl https://api.yourdomain.com/health

# Monitor database
SELECT 1;
```

### Logs
```bash
# Centralized logging (ELK Stack, CloudWatch)
# Error tracking (Sentry, New Relic)
# Application performance monitoring
```

### Backups
```bash
# Daily database backups
# Image storage backups
# Configuration backups
```

---

For more information, see [Setup Guide](SETUP.md)
