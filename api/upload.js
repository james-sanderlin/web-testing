export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Parse multipart form data
  // Vercel serverless functions do not support streaming file uploads directly.
  // For demo: just echo back file info (name, size, type) from the request body if possible.
  // For real file storage, use a third-party service (S3, Cloudinary, etc.)

  // Try to get file info from the request (for demo, not for production)
  let fileInfo = {};
  if (req.body && typeof req.body === 'object') {
    fileInfo = {
      name: req.body.name || 'unknown',
      size: req.body.size || 0,
      type: req.body.type || 'unknown',
    };
  }

  res.status(200).json({ message: 'Received!', file: fileInfo });
}
