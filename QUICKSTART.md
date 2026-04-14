# Quick Start Guide - Infrastructure Damage Detection System

## 🚀 5-Minute Quick Start

### Windows PowerShell

```powershell
# 1. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup backend
cd backend
copy ..\requirements.txt requirements_backend.txt
uvicorn main:app --reload

# 4. In another terminal, setup frontend
cd frontend
npm install
npm start
```

### macOS/Linux (Bash)

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup backend
cd backend
uvicorn main:app --reload

# 4. In another terminal, setup frontend
cd frontend
npm install
npm start
```

## ✅ Access Applications

| Service | URL | Description |
|---------|-----|-------------|
| Frontend Application | http://localhost:3000 | Web UI |
| Backend API | http://localhost:8000 | REST API |
| API Documentation | http://localhost:8000/docs | Swagger UI |
| ReDoc Documentation | http://localhost:8000/redoc | Alternative docs |

## 📋 First Steps

### 1. Upload an Image
- Go to http://localhost:3000/detect
- Upload an image of road damage
- Optionally add GPS and road type
- Click "Detect Damage"

### 2. View Results
- See detection results with severity
- Check estimated repair cost
- View confidence scores

### 3. Send Alerts
- Get contractor recommendations
- Send SMS alerts (if Twilio configured)
- Track repair status

### 4. View Dashboard
- Check statistics and trends
- View damage history
- Access map visualization

## 🔧 Configuration

### Add Your API Keys (Optional for testing)

Edit `.env` file:

```env
# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1-555-0000

# SendGrid (for email)
SENDGRID_API_KEY=your_key

# Google Maps (for map view)
GOOGLE_MAPS_API_KEY=your_key
```

## 📚 Sample Test Data

### Test Image URLs
```
Pothole: https://example.com/pothole.jpg
Crack: https://example.com/crack.jpg
No Damage: https://example.com/road.jpg
```

### Test GPS Coordinates
```
Manhattan, NY: 40.7128, -74.0060
Brooklyn, NY: 40.6782, -73.9442
Queens, NY: 40.7282, -73.7949
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
uvicorn main:app --port 8001
```

### Module Not Found
```bash
# Ensure virtual environment is activated
which python  # should show venv path

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### CORS Errors
- Ensure backend is running on port 8000
- Check frontend .env for correct API URL
- Verify CORS is enabled in FastAPI

### Database Issues
```bash
# Reset database
rm infrastructure_damage.db
python -c "from database.database import init_db; init_db()"
```

## 🎯 Next Steps

1. **Train Custom Model** → See `model/train.py`
2. **Deploy to Cloud** → See `docs/DEPLOYMENT.md`
3. **Setup Monitoring** → Add Sentry/DataDog
4. **Scale System** → Add Redis cache, Celery tasks
5. **Mobile App** → Build React Native app

## 💡 Tips

- Use `--reload` for development (auto-restart on changes)
- Check browser console (F12) for frontend errors
- Use `/docs` endpoint for API testing
- Enable DEBUG mode for detailed logs
- Monitor GPU usage: `nvidia-smi -l 1`

## 📞 Need Help?

- Check `docs/` folder for detailed guides
- Review `README.md` for complete documentation
- Check GitHub Issues
- Email: support@infrastructure-detection.local

---

**Happy coding! 🎉**
