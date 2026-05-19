import app from './app'
import { setupCron } from './cron/morningNotification'

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`FamilyHub backend listening on :${PORT}`)
  setupCron()
})
