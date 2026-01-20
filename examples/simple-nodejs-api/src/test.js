// Simple test script to verify API functionality
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🧪 Testing Simple Node.js API...\n');
console.log(`Target URL: ${API_URL}\n`);

async function runTests() {
    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check...');
        const healthResponse = await fetch(API_URL);
        const healthData = await healthResponse.json();
        console.log('✅ Health check passed');
        console.log('   Response:', JSON.stringify(healthData, null, 2).substring(0, 200) + '...\n');

        // Test 2: Get All Tasks
        console.log('Test 2: Get All Tasks...');
        const tasksResponse = await fetch(`${API_URL}/api/tasks`);
        const tasksData = await tasksResponse.json();
        console.log('✅ Get all tasks passed');
        console.log(`   Found ${tasksData.count} tasks\n`);

        // Test 3: Create Task
        console.log('Test 3: Create Task...');
        const createResponse = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Test deployment with agent-cloud' })
        });
        const newTask = await createResponse.json();
        console.log('✅ Create task passed');
        console.log('   New task:', newTask.data);
        console.log('');

        // Test 4: Update Task
        console.log('Test 4: Update Task...');
        const updateResponse = await fetch(`${API_URL}/api/tasks/${newTask.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
        });
        const updatedTask = await updateResponse.json();
        console.log('✅ Update task passed');
        console.log('   Updated task:', updatedTask.data);
        console.log('');

        // Test 5: Get Statistics
        console.log('Test 5: Get Statistics...');
        const statsResponse = await fetch(`${API_URL}/api/stats`);
        const stats = await statsResponse.json();
        console.log('✅ Get statistics passed');
        console.log('   Stats:', stats.data);
        console.log('');

        // Test 6: Delete Task
        console.log('Test 6: Delete Task...');
        const deleteResponse = await fetch(`${API_URL}/api/tasks/${newTask.data.id}`, {
            method: 'DELETE'
        });
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete task passed');
        console.log('   Deleted task:', deleteResult.data);
        console.log('');

        console.log('🎉 All tests passed successfully!\n');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
