// Job Status Types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

// Job Input Structure
export interface JobInput {
    instructions: string
    character_image_url: string
    product_image_url: string
}

// Job Output Structure
export interface JobOutput {
    image_url: string
    generated_at: string
}

// Job Error Structure
export interface JobError {
    code: string
    message: string
    details?: Record<string, unknown>
}

// Main Job Type
export interface Job {
    id: string
    user_id: string
    status: JobStatus
    input: JobInput
    output: JobOutput | null
    error: JobError | null
    n8n_execution_id: string | null
    attempts: number
    created_at: string
    updated_at: string
    completed_at: string | null
}

// User Profile Type
export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

// API Request/Response Types
export interface CreateJobRequest {
    instructions: string
    character_image: string // base64
    product_image: string // base64
}

export interface CreateJobResponse {
    job_id: string
    status: JobStatus
    created_at: string
}

export interface JobStatusResponse {
    id: string
    status: JobStatus
    output: JobOutput | null
    error: JobError | null
    created_at: string
    completed_at: string | null
}

// N8N Callback Types
export interface N8NCallbackPayload {
    job_id: string
    status: 'completed' | 'failed'
    image?: string // base64 encoded PNG
    error?: {
        code: string
        message: string
    }
    timestamp: string
    signature: string
}
