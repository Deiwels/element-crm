/**
 * Firestore Auto-Index Utility
 *
 * Catches FAILED_PRECONDITION errors from Firestore queries,
 * parses the missing index info, and creates it automatically
 * via the Google Cloud Firestore Admin REST API.
 *
 * Usage (in your backend):
 *
 *   import { withAutoIndex } from './firestore-auto-index'
 *
 *   // Wrap any Firestore query:
 *   const snap = await withAutoIndex(() =>
 *     db.collection('attendance')
 *       .where('date', '>=', from)
 *       .where('date', '<=', to)
 *       .orderBy('date')
 *       .get()
 *   )
 *
 * Requirements:
 *   - GOOGLE_CLOUD_PROJECT env var (or pass projectId)
 *   - Service account with roles/datastore.indexAdmin permission
 *   - google-auth-library package: npm i google-auth-library
 */

import { GoogleAuth } from 'google-auth-library'

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })

interface IndexField {
  fieldPath: string
  order?: 'ASCENDING' | 'DESCENDING'
  arrayConfig?: 'CONTAINS'
}

interface ParsedIndex {
  collectionGroup: string
  fields: IndexField[]
}

/**
 * Parse the index creation URL from a Firestore FAILED_PRECONDITION error.
 * The error message looks like:
 *   "The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/PROJECT/firestore/indexes?create_composite=ENCODED"
 */
function parseIndexUrl(errorMessage: string): string | null {
  const match = errorMessage.match(
    /https:\/\/console\.firebase\.google\.com[^\s"')]+/
  )
  return match ? match[0] : null
}

/**
 * Parse index fields from the Firestore error details (gRPC metadata).
 * Some Firestore SDKs include structured index info in error.details or error.metadata.
 */
function parseIndexFromError(err: any): ParsedIndex | null {
  // Method 1: Parse from error details (Admin SDK sometimes includes this)
  if (err.details && typeof err.details === 'string') {
    // Extract collection and fields from the error message
    const colMatch = err.details.match(
      /collection[:\s]+["']?(\w+)["']?/i
    )
    const collection = colMatch ? colMatch[1] : null

    if (collection) {
      const fieldMatches = [
        ...err.details.matchAll(/field[:\s]+["']?(\w+)["']?/gi),
      ]
      if (fieldMatches.length > 0) {
        return {
          collectionGroup: collection,
          fields: fieldMatches.map((m: RegExpMatchArray) => ({
            fieldPath: m[1],
            order: 'ASCENDING' as const,
          })),
        }
      }
    }
  }

  return null
}

/**
 * Create a composite index via the Firestore Admin REST API.
 */
async function createIndex(
  projectId: string,
  databaseId: string,
  collectionGroup: string,
  fields: IndexField[]
): Promise<{ success: boolean; operationName?: string; error?: string }> {
  try {
    const client = await auth.getClient()
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}` +
      `/databases/${databaseId}/collectionGroups/${collectionGroup}/indexes`

    const body = {
      queryScope: 'COLLECTION',
      fields: fields.map((f) => ({
        fieldPath: f.fieldPath,
        ...(f.arrayConfig
          ? { arrayConfig: f.arrayConfig }
          : { order: f.order || 'ASCENDING' }),
      })),
    }

    const res = await client.request({
      url,
      method: 'POST',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    })

    const data = res.data as any
    console.log(
      `[auto-index] Index creation started: ${data.name || 'unknown'}`
    )
    console.log(
      `[auto-index] Collection: ${collectionGroup}, Fields: ${fields.map((f) => f.fieldPath).join(', ')}`
    )

    return { success: true, operationName: data.name }
  } catch (e: any) {
    // Index might already exist (409 ALREADY_EXISTS)
    if (e.code === 409 || e.response?.status === 409) {
      console.log(`[auto-index] Index already exists for ${collectionGroup}`)
      return { success: true }
    }
    console.error(`[auto-index] Failed to create index:`, e.message)
    return { success: false, error: e.message }
  }
}

/**
 * Wraps a Firestore query. If it fails with FAILED_PRECONDITION (missing index),
 * logs the index URL and attempts to create the index automatically.
 *
 * Note: Index creation takes 1-5 minutes. The first call will still fail,
 * but subsequent calls will work once the index is built.
 */
export async function withAutoIndex<T>(
  queryFn: () => Promise<T>,
  options?: { projectId?: string; databaseId?: string }
): Promise<T> {
  const projectId =
    options?.projectId || process.env.GOOGLE_CLOUD_PROJECT || ''
  const databaseId = options?.databaseId || '(default)'

  try {
    return await queryFn()
  } catch (err: any) {
    const code = err.code || err.status
    const message = err.message || err.details || ''

    // Only handle missing index errors
    if (code !== 9 && code !== 'failed-precondition' && code !== 400) {
      throw err
    }

    if (!message.toLowerCase().includes('index')) {
      throw err
    }

    // Log the Firebase Console URL for manual creation
    const indexUrl = parseIndexUrl(message)
    if (indexUrl) {
      console.warn(`[auto-index] Missing index detected!`)
      console.warn(`[auto-index] Create manually: ${indexUrl}`)
    }

    // Try to auto-create via Admin API
    const parsed = parseIndexFromError(err)
    if (parsed && projectId) {
      console.log(`[auto-index] Attempting automatic index creation...`)
      await createIndex(projectId, databaseId, parsed.collectionGroup, parsed.fields)
    }

    // Re-throw — caller should retry later once index is built
    const enhanced = new Error(
      `Firestore index is being created. Please retry in a few minutes.${indexUrl ? ` Manual link: ${indexUrl}` : ''}`
    )
    ;(enhanced as any).code = 'INDEX_BUILDING'
    ;(enhanced as any).indexUrl = indexUrl
    ;(enhanced as any).originalError = err
    throw enhanced
  }
}

/**
 * Ensure all required indexes exist at server startup.
 * Call this once when your server starts.
 */
export async function ensureIndexes(
  projectId?: string,
  databaseId = '(default)'
): Promise<void> {
  const pid = projectId || process.env.GOOGLE_CLOUD_PROJECT
  if (!pid) {
    console.warn('[auto-index] No GOOGLE_CLOUD_PROJECT set, skipping index check')
    return
  }

  const requiredIndexes: { collection: string; fields: IndexField[] }[] = [
    {
      collection: 'attendance',
      fields: [
        { fieldPath: 'date', order: 'ASCENDING' },
        { fieldPath: 'clock_in', order: 'ASCENDING' },
      ],
    },
    {
      collection: 'attendance',
      fields: [
        { fieldPath: 'date', order: 'ASCENDING' },
        { fieldPath: 'user_id', order: 'ASCENDING' },
      ],
    },
    {
      collection: 'attendance',
      fields: [
        { fieldPath: 'user_id', order: 'ASCENDING' },
        { fieldPath: 'date', order: 'ASCENDING' },
        { fieldPath: 'clock_in', order: 'ASCENDING' },
      ],
    },
    {
      collection: 'attendance',
      fields: [
        { fieldPath: 'user_id', order: 'ASCENDING' },
        { fieldPath: 'clock_out', order: 'ASCENDING' },
      ],
    },
  ]

  console.log(`[auto-index] Ensuring ${requiredIndexes.length} indexes exist...`)

  for (const idx of requiredIndexes) {
    await createIndex(pid, databaseId, idx.collection, idx.fields)
  }

  console.log(`[auto-index] Index check complete.`)
}
