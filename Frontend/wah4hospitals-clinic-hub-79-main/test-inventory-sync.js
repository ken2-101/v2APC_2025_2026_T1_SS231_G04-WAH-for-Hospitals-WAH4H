/**
 * TEST SCRIPT: Verify Inventory-Request Syncing
 * 
 * Instructions:
 * 1. Open the Pharmacy page
 * 2. Open browser console (F12 → Console tab)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 
 * This will create a test medication request and verify it shows correct inventory availability
 */

(async function testInventorySync() {
  console.log('=== Starting Inventory-Request Sync Test ===');
  
  try {
    // Import the pharmacy service (adjust if needed based on your build)
    const { default: pharmacyService } = await import('/src/services/pharmacyService.ts');
    
    // Step 1: Fetch current inventory
    console.log('\n📦 Step 1: Fetching inventory...');
    const inventory = await pharmacyService.getInventory();
    console.log(`Found ${inventory.length} items in inventory`);
    
    if (inventory.length === 0) {
      console.error('❌ No inventory items found. Please add inventory first.');
      return;
    }
    
    // Pick the first item
    const testItem = inventory[0];
    console.log('\n✅ Selected test item:', {
      name: testItem.generic_name,
      quantity: testItem.quantity,
      batch: testItem.batch_number
    });
    
    // Step 2: Create a test medication request
    console.log('\n💊 Step 2: Creating test medication request...');
    const testRequest = await pharmacyService.createRequest({
      admission: 31, // Use an existing admission ID
      subject_id: 51, // Use an existing patient ID
      requester_id: 1,
      inventory_item: testItem.id,
      inventory_item_detail: testItem, // THIS IS THE KEY FIX
      quantity: 5,
      notes: 'TEST REQUEST - Auto-generated to verify inventory sync',
      medication_code: testItem.item_code || 'TEST-CODE',
      medication_display: testItem.generic_name
    });
    
    console.log('\n✅ Request created successfully!');
    console.log('Request Details:', {
      id: testRequest.id,
      medication: testRequest.inventory_item_detail?.generic_name,
      requestedQty: testRequest.quantity,
      availableQty: testRequest.inventory_item_detail?.quantity,
      batch: testRequest.inventory_item_detail?.batch_number
    });
    
    // Step 3: Verify the data
    console.log('\n🔍 Step 3: Verification');
    if (testRequest.inventory_item_detail?.quantity === testItem.quantity) {
      console.log('✅ SUCCESS! Available quantity matches inventory:', testItem.quantity);
      console.log('✅ Batch number populated:', testRequest.inventory_item_detail?.batch_number);
      console.log('✅ Brand name populated:', testRequest.inventory_item_detail?.brand_name);
      console.log('\n🎉 INVENTORY SYNC IS WORKING CORRECTLY!');
    } else {
      console.log('❌ FAILED! Available quantity does not match');
      console.log('Expected:', testItem.quantity);
      console.log('Got:', testRequest.inventory_item_detail?.quantity);
    }
    
    // Step 4: Refresh the page to see it in the UI
    console.log('\n📄 Step 4: Refreshing requests list...');
    const allRequests = await pharmacyService.getRequests('pending');
    console.log(`Total pending requests: ${allRequests.length}`);
    
    console.log('\n✅ Test completed! Check the Medication Requests tab to see your new request.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
  }
})();
