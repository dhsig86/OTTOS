import fs from 'fs';

async function run() {
    try {
        console.log("Mocking CommunityDonation.tsx formData...");
        
        // Create an empty dummy file buffer
        const dummyBuffer = Buffer.from('fffff', 'utf-8');
        
        const blob = new Blob([dummyBuffer], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('files', blob, 'test.jpg');
        formData.append('diagnostic', 'Otite Externa Aguda');
        // DELIBERATELY MISSING clinical_case 
        
        const res = await fetch("https://otto-atlas.onrender.com/api/curadoria/donate", {
            method: 'POST',
            body: formData
        });
        
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("RESPONSE:", text);
    } catch (e) {
        console.log("ERROR:", e);
    }
}
run();
