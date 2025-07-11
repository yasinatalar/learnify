"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from "@/lib/i18n/context"

interface FileUploadProps {
  onUploadComplete?: (fileId: string) => void
  maxSize?: number
  acceptedTypes?: string[]
  processingOptions?: {
    generateFlashcards: boolean
    generateQuiz: boolean
    flashcardCount: string
    quizQuestionCount: string
    difficulty: string
  }
  disabled?: boolean
  disabledMessage?: string
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}

export function FileUpload({
  onUploadComplete,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ],
  processingOptions,
  disabled = false,
  disabledMessage = "Upload disabled",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const t = useTranslations()

  // Safe accessor function for translations
  const getText = (path: string, fallback: string = '') => {
    const keys = path.split('.')
    let current: any = t
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return fallback
      }
    }
    
    return typeof current === 'string' ? current : fallback
  }

  // Helper function to replace placeholders in translation strings
  const replaceTemplateVars = (template: string, vars: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] || match)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejected) => {
        const { file, errors } = rejected
        errors.forEach((error: any) => {
          if (error.code === "file-too-large") {
            const message = replaceTemplateVars(
              getText('upload.fileTooLarge', 'File {fileName} is too large. Maximum size is {maxSize}.'),
              { fileName: file.name, maxSize: formatFileSize(maxSize) }
            )
            toast.error(message)
          } else if (error.code === "file-invalid-type") {
            const message = replaceTemplateVars(
              getText('upload.fileNotSupported', 'File {fileName} is not a supported type.'),
              { fileName: file.name }
            )
            toast.error(message)
          } else {
            const message = replaceTemplateVars(
              getText('upload.fileError', 'Error with file {fileName}: {error}'),
              { fileName: file.name, error: error.message }
            )
            toast.error(message)
          }
        })
      })

      // Handle accepted files
      acceptedFiles.forEach((file) => {
        const uploadFile: UploadFile = {
          file,
          id: Math.random().toString(36).substring(7),
          progress: 0,
          status: "uploading",
        }

        setFiles((prev) => [...prev, uploadFile])
        uploadFileToServer(uploadFile)
      })
    },
    [maxSize, getText, replaceTemplateVars]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    maxSize,
    multiple: true,
    disabled,
  })

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    try {
      const formData = new FormData()
      formData.append("file", uploadFile.file)
      
      // Add processing options if provided
      if (processingOptions) {
        formData.append("processingOptions", JSON.stringify({
          generateFlashcards: processingOptions.generateFlashcards,
          generateQuiz: processingOptions.generateQuiz,
          flashcardCount: parseInt(processingOptions.flashcardCount),
          quizQuestionCount: parseInt(processingOptions.quizQuestionCount),
          difficulty: processingOptions.difficulty,
        }))
      }

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          )
        }
      })

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            
            if (response.success && response.documentId) {
              // Update file status to completed immediately
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: "completed", progress: 100 }
                    : f
                )
              )
              
              const successMessage = replaceTemplateVars(
                getText('upload.uploadedSuccessfully', '{fileName} uploaded and processed successfully!'),
                { fileName: uploadFile.file.name }
              )
              toast.success(successMessage)
              onUploadComplete?.(response.documentId)
            } else {
              throw new Error(response.error || "Upload failed")
            }
          } catch (error) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: "error", error: (error as Error).message }
                  : f
              )
            )
            const errorMessage = replaceTemplateVars(
              getText('upload.uploadFailed', 'Failed to upload {fileName}'),
              { fileName: uploadFile.file.name }
            )
            toast.error(`${errorMessage}: ${(error as Error).message}`)
          }
        } else {
          const errorText = xhr.responseText
          let errorMessage = `Upload failed with status: ${xhr.status}`
          
          try {
            const errorResponse = JSON.parse(errorText)
            if (errorResponse.error) {
              errorMessage = errorResponse.error
            }
          } catch {
            // Keep the default error message
          }
          
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error", error: errorMessage }
                : f
            )
          )
          const failedMessage = replaceTemplateVars(
            getText('upload.uploadFailed', 'Failed to upload {fileName}'),
            { fileName: uploadFile.file.name }
          )
          toast.error(`${failedMessage}: ${errorMessage}`)
        }
      })

      xhr.addEventListener("error", () => {
        const networkError = getText('upload.networkError', 'Network error')
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: networkError }
              : f
          )
        )
        const failedMessage = replaceTemplateVars(
          getText('upload.uploadFailed', 'Failed to upload {fileName}'),
          { fileName: uploadFile.file.name }
        )
        toast.error(failedMessage)
      })

      xhr.addEventListener("timeout", () => {
        const timeoutError = getText('upload.uploadTimeoutError', 'Upload timeout')
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: timeoutError }
              : f
          )
        )
        const timeoutMessage = replaceTemplateVars(
          getText('upload.uploadTimeout', 'Upload timeout for {fileName}'),
          { fileName: uploadFile.file.name }
        )
        toast.error(timeoutMessage)
      })

      xhr.open("POST", "/api/documents/upload")
      xhr.send(formData)
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error", error: (error as Error).message }
            : f
        )
      )
      const failedMessage = replaceTemplateVars(
        getText('upload.uploadFailed', 'Failed to upload {fileName}'),
        { fileName: uploadFile.file.name }
      )
      toast.error(failedMessage)
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              disabled
                ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                : isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 cursor-pointer"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
            )}
          >
            <input {...getInputProps()} />
            <Upload className={cn(
              "mx-auto h-12 w-12 mb-4",
              disabled ? "text-gray-300 dark:text-gray-600" : "text-gray-400"
            )} />
            <h3 className={cn(
              "text-lg font-medium mb-2",
              disabled ? "text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white"
            )}>
              {disabled 
                ? getText('upload.uploadDisabled', 'Upload disabled')
                : isDragActive 
                  ? getText('upload.dropFilesHere', 'Drop files here')
                  : getText('upload.uploadYourDocuments', 'Upload your documents')
              }
            </h3>
            <p className={cn(
              "mb-4",
              disabled ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-300"
            )}>
              {disabled ? disabledMessage : getText('upload.dragAndDropFiles', 'Drag and drop your files here, or click to browse')}
            </p>
            {!disabled && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getText('upload.supportedFileTypes', 'Supports PDF, DOCX, TXT, and Markdown files up to')} {formatFileSize(maxSize)}
                </p>
                <Button className="mt-4">
                  {getText('upload.chooseFiles', 'Choose Files')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {getText('upload.uploadProgress', 'Upload Progress')}
            </h4>
            <div className="space-y-4">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {uploadFile.status === "completed" && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                    {uploadFile.status === "error" && (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    {(uploadFile.status === "uploading" || uploadFile.status === "processing") && (
                      <File className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {uploadFile.file.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                        {uploadFile.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      {uploadFile.status === "uploading" && (
                        <>
                          <Progress value={uploadFile.progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {getText('upload.uploading', 'Uploading...')} {uploadFile.progress}%
                          </p>
                        </>
                      )}
                      {uploadFile.status === "processing" && (
                        <>
                          <Progress value={100} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {getText('upload.processingWithAI', 'Processing with AI...')}
                          </p>
                        </>
                      )}
                      {uploadFile.status === "completed" && (
                        <p className="text-xs text-green-600 mt-1">
                          {getText('upload.uploadCompleted', 'Upload completed successfully!')}
                        </p>
                      )}
                      {uploadFile.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">
                          {getText('common.error', 'Error')}: {uploadFile.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}