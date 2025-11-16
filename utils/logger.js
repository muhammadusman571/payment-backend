const { exec } = require('child_process');

function handleLogRequest(req, res) {
  const containerName = 'milkyswipe-backend'; 
  const lines = parseInt(req.query.lines) || 100;

  exec(`docker logs --tail ${lines} ${containerName}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to fetch logs', details: stderr });
    }

    res.json({ success: true, message: 'Logs fetched', logs: stdout.split('\n') });
  });
}

module.exports = handleLogRequest;
