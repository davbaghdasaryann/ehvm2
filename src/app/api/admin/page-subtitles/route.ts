import { readPageSubtitles, writePageSubtitles } from '@/lib/adminDb'
import { revalidateTag } from 'next/cache'

export async function GET() {
  try {
    const pageSubtitles = await readPageSubtitles()
    return Response.json({ pageSubtitles })
  } catch {
    return Response.json({ error: 'Failed to read page subtitles' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { pageSubtitles } = await req.json()
    await writePageSubtitles(pageSubtitles)
    revalidateTag('page-subtitles-data', 'max')
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to save page subtitles' }, { status: 500 })
  }
}
