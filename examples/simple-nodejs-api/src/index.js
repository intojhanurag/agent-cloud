const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory data store
let tasks = [
    { id: 1, title: 'Learn Agent Cloud', completed: false, createdAt: new Date().toISOString() },
    { id: 2, title: 'Deploy to AWS', completed: false, createdAt: new Date().toISOString() },
    { id: 3, title: 'Test deployment', completed: false, createdAt: new Date().toISOString() }
];

// Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Simple Node.js API! 🚀',
        description: 'This is a demo application deployed using agent-cloud',
        endpoints: {
            health: 'GET /',
            getAllTasks: 'GET /api/tasks',
            getTask: 'GET /api/tasks/:id',
            createTask: 'POST /api/tasks',
            updateTask: 'PUT /api/tasks/:id',
            deleteTask: 'DELETE /api/tasks/:id',
            stats: 'GET /api/stats'
        },
        deployment: {
            cloud: process.env.CLOUD_PROVIDER || 'local',
            region: process.env.CLOUD_REGION || 'N/A',
            timestamp: new Date().toISOString()
        }
    });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    res.json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));

    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    res.json({
        success: true,
        data: task
    });
});

// Create task
app.post('/api/tasks', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: 'Title is required'
        });
    }

    const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        title,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask
    });
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));

    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const { title, completed } = req.body;

    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    task.updatedAt = new Date().toISOString();

    res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
    });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));

    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({
        success: true,
        message: 'Task deleted successfully',
        data: deletedTask
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;

    res.json({
        success: true,
        data: {
            total: tasks.length,
            completed: completedTasks,
            pending: pendingTasks,
            completionRate: tasks.length > 0
                ? ((completedTasks / tasks.length) * 100).toFixed(2) + '%'
                : '0%'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀 Simple Node.js API Server Started! 🚀           ║
║                                                            ║
║  Server running on: http://localhost:${PORT}                ║
║  Environment: ${process.env.NODE_ENV || 'development'}                           ║
║  Cloud Provider: ${process.env.CLOUD_PROVIDER || 'local'}                        ║
║                                                            ║
║  📖 API Documentation:                                     ║
║  - Health Check: GET /                                     ║
║  - List Tasks: GET /api/tasks                              ║
║  - Get Task: GET /api/tasks/:id                            ║
║  - Create Task: POST /api/tasks                            ║
║  - Update Task: PUT /api/tasks/:id                         ║
║  - Delete Task: DELETE /api/tasks/:id                      ║
║  - Statistics: GET /api/stats                              ║
║                                                            ║
║  Deployed with ❤️ using agent-cloud by ojha_verse         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    process.exit(0);
});
