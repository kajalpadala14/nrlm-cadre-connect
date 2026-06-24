import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const envConfig = fs.readFileSync(filePath, "utf-8");
    envConfig.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
};
loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function mergeBlocks() {
  console.log("Fetching blocks...");
  const { data: blocks, error: fetchErr } = await supabase.from('blocks').select('*');
  if (fetchErr) {
    console.error("Error fetching blocks:", fetchErr);
    return;
  }
  
  console.log("Current blocks:", blocks);

  const merges = [
    { targetName: "Geedam (गीदम)", sourceName: "Geedam" },
    { targetName: "Katekalyan (कटेकल्याण)", sourceName: "Katekalyan" },
    { targetName: "Kuwakonda (कुआकोंडा)", sourceName: "Kuwakonda" }
  ];

  for (const merge of merges) {
    const targetBlock = blocks.find(b => b.name === merge.targetName);
    const sourceBlock = blocks.find(b => b.name === merge.sourceName);

    if (targetBlock && sourceBlock) {
      console.log(`Merging ${merge.sourceName} (${sourceBlock.id}) into ${merge.targetName} (${targetBlock.id})...`);
      
      // Update profiles
      const { data: pData, error: pErr } = await supabase.from('profiles').update({ block_id: targetBlock.id }).eq('block_id', sourceBlock.id);
      if (pErr) console.error("Error updating profiles:", pErr);
      else console.log(`Profiles updated.`);

      // Update activities
      const { data: actData, error: actErr } = await supabase.from('activities').update({ block_id: targetBlock.id }).eq('block_id', sourceBlock.id);
      if (actErr) console.error("Error updating activities:", actErr);
      else console.log(`Activities updated.`);

      // Update attendance
      const { data: attData, error: attErr } = await supabase.from('attendance').update({ block_id: targetBlock.id }).eq('block_id', sourceBlock.id);
      if (attErr) console.error("Error updating attendance:", attErr);
      else console.log(`Attendance updated.`);

      // Update leave_requests
      try {
        const { data: lData, error: lErr } = await supabase.from('leave_requests').update({ block_id: targetBlock.id }).eq('block_id', sourceBlock.id);
        if (lErr) console.error("Error updating leave requests:", lErr);
        else console.log(`Leave requests updated.`);
      } catch (e) {
        console.log("No leave_requests table or update skipped");
      }

      // Delete source block
      const { error: delErr } = await supabase.from('blocks').delete().eq('id', sourceBlock.id);
      if (delErr) {
        console.error(`Error deleting block ${merge.sourceName}:`, delErr);
      } else {
        console.log(`Deleted block ${merge.sourceName}.`);
      }
    } else {
      console.log(`Could not find both ${merge.targetName} and ${merge.sourceName} to merge.`);
    }
  }

  // Update district_name for Hindi blocks and Dantewada to 'Dantewada'
  console.log("Setting district_name = 'Dantewada' for remaining blocks...");
  const { error: distErr } = await supabase.from('blocks').update({ district_name: 'Dantewada' }).in('name', [
    'Geedam (गीदम)',
    'Katekalyan (कटेकल्याण)',
    'Kuwakonda (कुआकोंडा)',
    'Dantewada'
  ]);
  if (distErr) {
    console.error("Error updating district names:", distErr);
  } else {
    console.log("District names updated successfully.");
  }

  console.log("Verification:");
  const { data: finalBlocks } = await supabase.from('blocks').select('*');
  console.log(finalBlocks);
}

mergeBlocks();
