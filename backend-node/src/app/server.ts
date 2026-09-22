import { createApp } from './app';
import { config } from '../shared/config/config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});