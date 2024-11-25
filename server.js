const express = require('express');
const routeIndex = require('./routes/index')
const app = express();
const port = process.env.PORT || 5000;

app.use('/status', routeIndex);
app.use('/stats', routeIndex);

app.listen(port, () => {
    console.log(`Serveur start http://'127.0.0.1:${port}`)
})