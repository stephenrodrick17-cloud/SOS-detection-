import os
import shutil
import random
from PIL import Image

def prepare_archive3():
    base_dir = r"c:\Users\asus\Downloads\Road portfolio"
    archive3_dir = os.path.join(base_dir, "archive (3)", "data", "Road Issues")
    target_dir = os.path.join(base_dir, "infrastructure-damage-detection", "model", "datasets", "combined_dataset")
    
    # Class mapping from archive3 to data.yaml
    # names: ['crack', 'pothole', 'structural', 'mixed']
    class_map = {
        "Pothole Issues": 1,
        "Mixed Issues": 3
    }
    
    for folder, class_id in class_map.items():
        folder_path = os.path.join(archive3_dir, folder)
        if not os.path.exists(folder_path):
            print(f"Folder not found: {folder_path}")
            continue
            
        images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Processing {len(images)} images from {folder}...")
        
        for img_name in images:
            # Decide split: 80% train, 10% val, 10% test
            r = random.random()
            if r < 0.8:
                split = "train"
            elif r < 0.9:
                split = "val"
            else:
                split = "test"
            
            src_img = os.path.join(folder_path, img_name)
            dest_img = os.path.join(target_dir, "images", split, img_name)
            dest_lbl = os.path.join(target_dir, "labels", split, os.path.splitext(img_name)[0] + ".txt")
            
            # Copy image
            os.makedirs(os.path.dirname(dest_img), exist_ok=True)
            shutil.copy2(src_img, dest_img)
            
            # Create label (full-image bbox: center=(0.5, 0.5), size=(0.9, 0.9))
            os.makedirs(os.path.dirname(dest_lbl), exist_ok=True)
            with open(dest_lbl, 'w') as f:
                f.write(f"{class_id} 0.5 0.5 0.9 0.9\n")

if __name__ == "__main__":
    prepare_archive3()
    print("Archive (3) integration complete.")
