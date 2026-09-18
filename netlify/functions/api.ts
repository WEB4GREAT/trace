import serverless from 'serverless-http'
import app from '../../server/app'

export const handler = serverless(app)
