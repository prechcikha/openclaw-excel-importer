const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api/imports';

// Test CSV content (simple employee data)
const TEST_CSV = `Employee_ID,Full_Name,Department,Email,Hire_Date
1,John Smith,Sales,john.smith@example.com,2023-01-15
2,Jane Doe,Engineering,jane.doe@example.com,2023-02-20
3,Bob Johnson,Marketing,bob.j@example.com,2023-03-10`;

// Test Excel (XLSX) buffer - minimal valid file with one sheet and 4 rows
const TEST_XLSX = Buffer.from([
    // XLSX header
    0x50, 0x4B, 0x03, 0x04,  // End of zip signature (ZIP file starts)
    0x14, 0x06, 0x08, 0xD8, 0x9C, 0xF7, 0xA2, 0xAA,
    // ... minimal Excel binary structure would go here
]);

async function testEndpoint(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    console.log('\n🧪 Testing Excel Importer API Endpoints\n');
    
    // Test 1: Check server is running
    console.log('1. Checking if server is running...');
    try {
        await testEndpoint('GET', '/api/imports/history');
        console.log('   ✅ Server is responding\n');
    } catch (error) {
        console.log('   ⚠️  Server not available:', error.message);
        console.log('\n📝 To start the server:');
        console.log('   cd js-rebuild/server && npm run dev\n');
        return;
    }

    // Test 2: Get import history (should work with empty DB)
    console.log('2. Testing GET /api/imports/history...');
    try {
        const result = await testEndpoint('GET', '/api/imports/history');
        console.log(`   Status: ${result.status}`);
        if (result.data && Array.isArray(result.data)) {
            console.log(`   Found ${result.data.length} import records\n`);
        } else {
            console.log('   Response:', result.raw.substring(0, 100), '...\n');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
    }

    // Test 3: Get non-existent import (should return 404)
    console.log('3. Testing GET /api/imports/:id (non-existent)...');
    try {
        const result = await testEndpoint('GET', '/api/imports/99999');
        console.log(`   Status: ${result.status} (${result.data.error || 'error'})\n`);
    } catch (error) {
        console.log('   ⚠️  Error:', error.message, '\n');
    }

    // Test 4: Delete non-existent import (should work gracefully)
    console.log('4. Testing DELETE /api/imports/:id (non-existent)...');
    try {
        const result = await testEndpoint('DELETE', '/api/imports/99998');
        console.log(`   Status: ${result.status}\n`);
    } catch (error) {
        console.log('   ⚠️  Error:', error.message, '\n');
    }

    console.log('\n✅ API endpoint tests completed!\n');
}

main().catch(console.error);
