const { spawn } = require('child_process');
const path = require('path');

/**
 * This script launches both the Chat Server and the AI Service
 * concurrently from the root directory.
 */

function launch(name, scriptPath) {
    console.log(`🚀 Launching ${name}...`);

    // Spawn a node process for the given script
    const process = spawn('node', [scriptPath], {
        stdio: 'inherit', // Pipes stdout and stderr directly to this terminal
        shell: true
    });

    process.on('error', (err) => {
        console.error(`❌ Failed to start ${name}:`, err);
    });

    return process;
}

async function main() {
    console.log('--------------------------------------------------');
    console.log('   Starting AI Chat System (Server + AI Bot)      ');
    console.log('--------------------------------------------------');

    // 1. Start the Chat Server first
    const serverPath = path.join(__dirname, 'chat-socket-app', 'server.js');
    const serverProcess = launch('Chat Server', serverPath);

    // 2. Wait a few seconds for the server to initialize before starting the bot
    console.log('\nWaiting 5 seconds for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Start the AI Service
    const aiPath = path.join(__dirname, 'ai-service', 'index.js');
    const aiProcess = launch('AI Bot Service', aiPath);

    console.log('\n--------------------------------------------------');
    console.log('✅ All systems are launching. Press Ctrl+C to stop all.');
    console.log('--------------------------------------------------\n');
}

main().catch(err => console.error('Launcher Error:', err));
