import { supabase } from '../utils/supabaseClient'
import { read, utils, write } from 'xlsx'

const MAIN_BUCKET = 'excel-files'

// No initialization needed for public bucket
export const initializeStorage = async () => {
  return true
}

// Upload Excel file to specific category folder
export const uploadExcelToStorage = async (file, categoryFolder, fileName = null) => {
  try {
    const finalFileName = fileName || `model-${Date.now()}.xlsx`
    const filePath = `${categoryFolder}/${finalFileName}`
    
    const { data, error } = await supabase.storage
      .from(MAIN_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Download and read Excel from specific category folder
export const getExcelFromStorage = async (categoryFolder, fileName = 'model.xlsx') => {
  try {
    const filePath = `${categoryFolder}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from(MAIN_BUCKET)
      .download(filePath)

    if (error) throw error
    
    // Convert to ArrayBuffer and read Excel
    const arrayBuffer = await data.arrayBuffer()
    const workbook = read(arrayBuffer)
    
    const sheets = {}
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      sheets[sheetName] = utils.sheet_to_json(worksheet, { defval: '' })
    })
    
    return { 
      sheets,
      fileName: filePath
    }
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// List all Excel files in a category folder
export const listExcelFiles = async (categoryFolder) => {
  try {
    const { data, error } = await supabase.storage
      .from(MAIN_BUCKET)
      .list(categoryFolder)

    if (error) {
      // Folder might not exist, return empty array
      if (error.message.includes('not found')) {
        return []
      }
      throw error
    }
    
    // Filter for Excel files
    const excelFiles = data ? data.filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    ) : []
    
    return excelFiles
  } catch (error) {
    console.error('List files error:', error)
    return []
  }
}

// Update Excel file in storage
export const updateExcelInStorage = async (filePath, sheetsData) => {
  try {
    // Create a new workbook
    const workbook = utils.book_new()
    
    // Add each sheet to the workbook
    Object.entries(sheetsData).forEach(([sheetName, data]) => {
      const worksheet = utils.json_to_sheet(data)
      utils.book_append_sheet(workbook, worksheet, sheetName)
    })
    
    // Convert workbook to binary
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // Upload updated file
    const { data, error } = await supabase.storage
      .from(MAIN_BUCKET)
      .update(filePath, blob, {
        cacheControl: '3600'
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Update error:', error)
    throw error
  }
}

// Delete Excel file from storage
export const deleteExcelFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(MAIN_BUCKET)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// Download Excel file directly
export const downloadExcelFile = async (filePath, downloadName = null) => {
  try {
    const { data, error } = await supabase.storage
      .from(MAIN_BUCKET)
      .download(filePath)

    if (error) throw error
    
    // Create download link
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName || filePath.split('/').pop()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}