#!/usr/bin/env python3
"""
Feedback Reporter Tool
Easy command-line tool to report model issues
"""

import argparse
import requests
import sys
from pathlib import Path

API_BASE = "http://localhost:8000/api/feedback"

def report_false_positive(image_path: str, detection_class: str, confidence: float, reason: str):
    """Report a false positive"""
    try:
        files = {
            "image_path": (None, image_path),
            "detection_class": (None, detection_class),
            "confidence": (None, str(confidence)),
            "reason": (None, reason)
        }
        
        response = requests.post(f"{API_BASE}/false-positive", data={
            "image_path": image_path,
            "detection_class": detection_class,
            "confidence": confidence,
            "reason": reason
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"   Retraining ready: {data['retraining_ready']}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def report_false_negative(image_path: str, damage_type: str, bbox: tuple, reason: str):
    """Report a false negative"""
    try:
        x1, y1, x2, y2 = bbox
        
        response = requests.post(f"{API_BASE}/false-negative", data={
            "image_path": image_path,
            "damage_type": damage_type,
            "bbox_x1": x1,
            "bbox_y1": y1,
            "bbox_x2": x2,
            "bbox_y2": y2,
            "reason": reason
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"   Retraining ready: {data['retraining_ready']}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def check_statistics():
    """Check feedback statistics"""
    try:
        response = requests.get(f"{API_BASE}/statistics")
        
        if response.status_code == 200:
            data = response.json()
            stats = data['statistics']
            
            print("\n📊 FEEDBACK STATISTICS")
            print("="*50)
            print(f"Total Feedback: {stats['total_feedback']}")
            print(f"False Positives: {stats['false_positives']}")
            print(f"False Negatives: {stats['false_negatives']}")
            print(f"Corrections: {stats['corrections']}")
            print(f"\nRetraining Ready: {'✅ Yes' if stats['ready_for_retraining'] else '❌ No'}")
            print(f"Status: {data['status']}")
            print(f"Message: {data['message']}")
            
            if data['recommendations']:
                print(f"\nRecommendations:")
                for rec in data['recommendations']:
                    print(f"  • {rec}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def check_summary():
    """Check detailed feedback summary"""
    try:
        response = requests.get(f"{API_BASE}/summary")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n📈 FEEDBACK SUMMARY")
            print("="*60)
            print(f"Total Feedback Samples: {data['total_feedback_samples']}")
            
            print(f"\nFalse Positives (Model detected something that wasn't there):")
            print(f"  Count: {data['false_positives']['count']}")
            print(f"  By class: {data['false_positives']['by_class']}")
            
            print(f"\nFalse Negatives (Model missed actual damage):")
            print(f"  Count: {data['false_negatives']['count']}")
            print(f"  By damage type: {data['false_negatives']['by_damage_type']}")
            
            print(f"\nCorrections: {data['corrections']['count']}")
            
            print(f"\nModel Improvement Potential:")
            print(f"  Status: {data['model_improvement_potential']['current_status']}")
            print(f"  Expected Improvement: {data['model_improvement_potential']['accuracy_improvement_expected']}")
            
            print(f"\nNext Action: {data['next_action']}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def trigger_retrain():
    """Trigger model retraining"""
    try:
        response = requests.post(f"{API_BASE}/retrain")
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'not_ready':
                print(f"❌ Not ready for retraining")
                print(f"   Message: {data['message']}")
                print(f"   Current feedback: {data['current_feedback']}")
            else:
                print(f"✅ {data['status'].upper()}")
                print(f"   Message: {data['message']}")
                print(f"   Expected duration: {data['expected_duration']}")
                print(f"   Feedback samples used: {data['feedback_samples_used']}")
                print(f"   Check progress: {data['check_progress']}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def check_retrain_status():
    """Check model retraining status"""
    try:
        response = requests.get(f"{API_BASE}/retrain-status")
        
        if response.status_code == 200:
            data = response.json()
            
            status_emoji = "⏳" if data['status'] == 'training_in_progress' else "✅"
            print(f"\n{status_emoji} RETRAINING STATUS: {data['status'].upper()}")
            print(f"Message: {data['message']}")
            if 'expected_completion' in data:
                print(f"Expected completion: {data['expected_completion']}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Report model issues for automatic fine-tuning",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Report false positive (model detected wrong)
  python report_feedback.py --false-positive \\
    --image backend/uploads/img.jpg \\
    --class pothole --confidence 0.85 \\
    --reason "Just a shadow, not a pothole"
  
  # Report false negative (model missed damage)
  python report_feedback.py --false-negative \\
    --image backend/uploads/img.jpg \\
    --damage crack --bbox 100 150 300 250 \\
    --reason "Clear crack in center"
  
  # Check feedback statistics
  python report_feedback.py --statistics
  
  # Check detailed summary
  python report_feedback.py --summary
  
  # Trigger retraining
  python report_feedback.py --retrain
  
  # Check retraining status
  python report_feedback.py --retrain-status
        """)
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # False positive
    fp_parser = subparsers.add_parser('fp', help='Report false positive')
    fp_parser.add_argument('image', help='Path to image')
    fp_parser.add_argument('--class', dest='detection_class', required=True, help='Detection class')
    fp_parser.add_argument('--confidence', type=float, required=True, help='Detection confidence')
    fp_parser.add_argument('--reason', required=True, help='Why it\'s a false positive')
    
    # False negative
    fn_parser = subparsers.add_parser('fn', help='Report false negative')
    fn_parser.add_argument('image', help='Path to image')
    fn_parser.add_argument('--damage', required=True, help='Damage type that was missed')
    fn_parser.add_argument('--bbox', nargs=4, type=int, required=True, help='Bbox: x1 y1 x2 y2')
    fn_parser.add_argument('--reason', required=True, help='Why it was missed')
    
    # Statistics
    subparsers.add_parser('stats', help='Check feedback statistics')
    
    # Summary
    subparsers.add_parser('summary', help='Check detailed summary')
    
    # Retrain
    subparsers.add_parser('retrain', help='Trigger model retraining')
    
    # Retrain status
    subparsers.add_parser('retrain-status', help='Check retraining status')
    
    args = parser.parse_args()
    
    if args.command == 'fp':
        report_false_positive(args.image, args.detection_class, args.confidence, args.reason)
    elif args.command == 'fn':
        report_false_negative(args.image, args.damage, tuple(args.bbox), args.reason)
    elif args.command == 'stats':
        check_statistics()
    elif args.command == 'summary':
        check_summary()
    elif args.command == 'retrain':
        trigger_retrain()
    elif args.command == 'retrain-status':
        check_retrain_status()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
