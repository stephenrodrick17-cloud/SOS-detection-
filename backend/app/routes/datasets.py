"""
Datasets Routes
"""

from fastapi import APIRouter, HTTPException
import os
from pathlib import Path
from typing import List, Dict, Any
import logging

from app.schemas import DatasetOverview, DatasetArchive, DatasetImage

logger = logging.getLogger(__name__)
router = APIRouter()

# Get the base project directory
# Current file is backend/app/routes/datasets.py
# Root is 5 levels up: Road portfolio/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

@router.get("/overview", response_model=DatasetOverview)
async def get_datasets_overview():
    """
    Get overview of available archive datasets
    """
    try:
        archives_data = []
        total_all_images = 0
        all_categories_count = {}

        archive_dirs = [
            ("archive (2)", BASE_DIR / "archive (2)"),
            ("archive (3)", BASE_DIR / "archive (3)"),
            ("archive (4)", BASE_DIR / "archive (4)")
        ]

        for name, path in archive_dirs:
            if not path.exists():
                logger.warning(f"Archive directory not found: {path}")
                continue

            images = []
            categories = set()
            
            # Walk through the directory to find images
            for root, dirs, files in os.walk(path):
                # Filter out system directories
                if "__pycache__" in root:
                    continue
                    
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                        # Determine category based on subfolder
                        category = Path(root).name
                        categories.add(category)
                        
                        rel_path = os.path.relpath(os.path.join(root, file), BASE_DIR)
                        
                        img_data = DatasetImage(
                            id=f"{name}_{file}",
                            filename=file,
                            category=category,
                            archive_name=name,
                            path=rel_path
                        )
                        images.append(img_data)
                        
                        # Update global category count
                        all_categories_count[category] = all_categories_count.get(category, 0) + 1

            total_all_images += len(images)
            
            # Limit sample images to first 10
            sample_images = images[:10]
            
            archives_data.append(DatasetArchive(
                name=name,
                total_images=len(images),
                categories=list(categories),
                sample_images=sample_images
            ))

        return DatasetOverview(
            archives=archives_data,
            total_images=total_all_images,
            categories=all_categories_count
        )

    except Exception as e:
        logger.error(f"Error getting datasets overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{archive_name}/images", response_model=List[DatasetImage])
async def get_archive_images(archive_name: str, category: str = None):
    """
    Get all images for a specific archive, optionally filtered by category
    """
    try:
        archive_path = BASE_DIR / archive_name
        if not archive_path.exists():
            raise HTTPException(status_code=404, detail=f"Archive {archive_name} not found")

        images = []
        for root, dirs, files in os.walk(archive_path):
            if "__pycache__" in root:
                continue
                
            current_category = Path(root).name
            if category and current_category != category:
                continue
                
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    rel_path = os.path.relpath(os.path.join(root, file), BASE_DIR)
                    images.append(DatasetImage(
                        id=f"{archive_name}_{file}",
                        filename=file,
                        category=current_category,
                        archive_name=archive_name,
                        path=rel_path
                    ))
        
        return images

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting images for {archive_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
