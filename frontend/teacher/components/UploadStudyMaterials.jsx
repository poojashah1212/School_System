import React, { useState, useCallback } from 'react';

const UploadStudyMaterials = ({ onUpload, classes = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'PDF',
    class: '',
    subject: '',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const materialTypes = [
    { value: 'PDF', label: 'PDF Document' },
    { value: 'VIDEO', label: 'Video Lecture' },
    { value: 'NOTES', label: 'Notes' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    const fileInput = document.getElementById('material-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.class || !formData.subject) {
      alert('Please fill in all required fields');
      return;
    }

    if (!file && formData.type !== 'VIDEO') {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('classId', formData.class);
      submitData.append('subject', formData.subject);
      submitData.append('description', formData.description);
      if (file) {
        submitData.append('materialFile', file);
      }

      if (onUpload) {
        await onUpload(submitData);
      } else {
        console.log('Form submitted:', Object.fromEntries(submitData));
      }

      // Reset form
      setFormData({
        title: '',
        type: 'PDF',
        class: '',
        subject: '',
        description: ''
      });
      removeFile();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (!file) return 'fa-file-alt';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'fa-file-video';
    return 'fa-file-alt';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-5">
      <div className="max-w-[750px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Upload Study Materials
          </h1>
          <p className="text-gray-500 text-sm">
            Share notes, videos, and learning resources with your students
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Grid Layout - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Material Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Chapter 1 Notes"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                           outline-none transition-all duration-200 text-gray-700
                           placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                           outline-none transition-all duration-200 text-gray-700
                           bg-white cursor-pointer"
                  required
                >
                  {materialTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                           outline-none transition-all duration-200 text-gray-700
                           bg-white cursor-pointer"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id || cls.id} value={cls._id || cls.id}>
                      {cls.name} {cls.grade ? `(${cls.grade})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                           outline-none transition-all duration-200 text-gray-700
                           placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the material..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                         outline-none transition-all duration-200 text-gray-700
                         placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Upload Area - Full Width */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              
              {!file ? (
                <div
                  id="upload-area"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('material-file-input').click()}
                  className={`
                    border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <i className={`fas fa-cloud-upload-alt text-2xl text-blue-500`}></i>
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-400 text-sm">
                      PDF, DOC, DOCX or MP4 (max 50MB)
                    </p>
                  </div>
                  <input
                    id="material-file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.mp4,.mov"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className={`fas ${getFileIcon()} text-xl text-blue-500`}></i>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 
                             flex items-center justify-center text-gray-500 
                             hover:text-red-500 transition-colors duration-200"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className={`
                  px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white 
                  font-medium rounded-lg transition-all duration-200
                  flex items-center gap-2
                  ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'}
                `}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i>
                    Upload Material
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadStudyMaterials;
