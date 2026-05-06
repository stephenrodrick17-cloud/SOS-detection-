/**
 * Browser Console Test Script for Detection Upload
 * 
 * USAGE:
 * 1. Open http://localhost:3000/detect in browser
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy-paste this entire script and press Enter
 * 5. Check the output for any errors
 */

async function testDetectionUpload() {
  console.log('🧪 Starting Detection Upload Test...\n');

  // Test 1: Check API URL
  console.log('✓ Test 1: Checking API configuration');
  const apiUrl = 'http://localhost:8000/api/detection/detect';
  console.log(`  API URL: ${apiUrl}\n`);

  // Test 2: Check backend health
  console.log('✓ Test 2: Checking backend health');
  try {
    const healthResponse = await fetch('http://localhost:8000/health');
    const health = await healthResponse.json();
    console.log(`  Backend Status: ${health.status}`);
    console.log(`  Backend Service: ${health.service}\n`);
  } catch (e) {
    console.error(`  ❌ Backend not responding: ${e.message}\n`);
    return;
  }

  // Test 3: Create and test with sample file
  console.log('✓ Test 3: Creating test image and attempting upload');
  
  try {
    // Create a canvas with simple pattern
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple pattern
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(320, 0, 320, 240);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(0, 240, 320, 240);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(320, 240, 320, 240);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      console.log(`  Test image created: ${blob.size} bytes\n`);
      
      // Test 4: Create FormData
      console.log('✓ Test 4: Creating FormData with file and metadata');
      const formData = new FormData();
      formData.append('file', blob, 'test_canvas.jpg');
      formData.append('latitude', 28.5244);
      formData.append('longitude', 77.0855);
      formData.append('road_type', 'highway');
      
      console.log('  FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`    - ${key}: Blob (${value.size} bytes, type: ${value.type})`);
        } else {
          console.log(`    - ${key}: ${value}`);
        }
      }
      console.log();
      
      // Test 5: Send upload request
      console.log('✓ Test 5: Sending detection request to backend');
      console.log(`  POST ${apiUrl}`);
      console.log(`  Content-Type: (automatic - multipart/form-data)\n`);
      
      try {
        const uploadResponse = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        
        console.log(`  Response Status: ${uploadResponse.status}`);
        console.log(`  Response Type: ${uploadResponse.headers.get('content-type')}\n`);
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          console.log('✅ UPLOAD SUCCESSFUL!\n');
          console.log('Response data:');
          console.log(`  Report ID: ${result.report_id}`);
          console.log(`  Detections Found: ${result.detections.length}`);
          console.log(`  Summary:`);
          console.log(`    - Total Damage Areas: ${result.summary.total_damage_areas}`);
          console.log(`    - Max Severity: ${result.summary.max_severity}`);
          console.log(`    - Estimated Cost: ₹${result.summary.total_estimated_cost}`);
          console.log(`  Annotated Image URL: ${result.annotated_image_url}\n`);
        } else {
          const errorText = await uploadResponse.text();
          console.error(`❌ UPLOAD FAILED with status ${uploadResponse.status}\n`);
          console.error('Error Response:', errorText.substring(0, 200));
        }
      } catch (fetchError) {
        console.error(`❌ FETCH ERROR: ${fetchError.name}`);
        console.error(`Message: ${fetchError.message}\n`);
        console.error('This usually means:');
        console.error('  1. Backend server is not running');
        console.error('  2. Backend is not accessible at http://localhost:8000');
        console.error('  3. Network/CORS issue\n');
      }
      
      // Test 6: Test endpoint availability
      console.log('✓ Test 6: Testing auxiliary endpoints');
      
      try {
        // Check if test endpoint exists
        const testResponse = await fetch('http://localhost:8000/api/detection/test-upload', {
          method: 'POST',
          body: formData
        });
        console.log(`  ✓ Test endpoint available (status ${testResponse.status})`);
      } catch (e) {
        console.log(`  ⚠ Test endpoint not available (might be expected)`);
      }
      
      console.log('\n📋 ='.repeat(35));
      console.log('TEST COMPLETE - Check output above for results');
      console.log('=' .repeat(72));
    }, 'image/jpeg', 0.9);
    
  } catch (error) {
    console.error(`❌ Test script error: ${error.message}`);
    console.error(error);
  }
}

// Run the test
testDetectionUpload();

console.log('\n💡 TIP: If you see errors, check:');
console.log('   1. Is backend running on port 8000?');
console.log('   2. Is frontend running on port 3000?');
console.log('   3. Check backend terminal for error messages');
console.log('   4. Check .env file for ALLOWED_ORIGINS configuration');
