const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clearDummyLeaves() {
  console.log('Fetching leave requests...');
  const { data, error } = await supabase.from('leave_requests').select('*');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${data.length} leave requests.`);
  console.log(data);
  
  if (data.length > 0) {
    console.log('Deleting all leave requests...');
    const { error: delErr } = await supabase
      .from('leave_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
      
    if (delErr) {
      console.error('Error deleting:', delErr);
    } else {
      console.log('Successfully deleted all dummy leave requests.');
    }
  }
  
  // Optional: Also clear attendance records that might have been created by the trigger if any were approved
  console.log('Cleaning up attendance records associated with dummy leaves...');
  const { error: attErr } = await supabase
    .from('attendance')
    .delete()
    .eq('status', 'on_leave');
    
  if (attErr) {
    console.error('Error cleaning attendance:', attErr);
  } else {
    console.log('Cleaned up associated attendance records.');
  }
}

clearDummyLeaves();
