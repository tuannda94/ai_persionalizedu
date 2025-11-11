"""
File Processing Service - Local Backend
Xử lý file uploads: OCR cho images, text extraction cho documents
"""
import os
import tempfile
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import base64

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  PIL/Pillow not available. Image processing will be limited.")

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  pytesseract not available. OCR will be disabled.")

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("⚠️  PyPDF2 not available. PDF text extraction will be disabled.")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("⚠️  python-docx not available. Word document extraction will be disabled.")


class FileProcessor:
    """Service để xử lý các loại file khác nhau"""

    def __init__(self):
        self.supported_image_types = [
            'image/jpeg', 'image/jpg', 'image/png',
            'image/gif', 'image/webp', 'image/bmp'
        ]
        self.supported_document_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv'
        ]

    def is_image(self, content_type: str) -> bool:
        """Check if file is an image"""
        return content_type in self.supported_image_types

    def is_document(self, content_type: str) -> bool:
        """Check if file is a document"""
        return content_type in self.supported_document_types

    def is_supported(self, content_type: str) -> bool:
        """Check if file type is supported"""
        return self.is_image(content_type) or self.is_document(content_type)

    def extract_text_from_image(self, file_path: str) -> str:
        """
        Extract text from image using OCR (Tesseract)

        Args:
            file_path: Path to image file

        Returns:
            Extracted text or empty string if OCR fails
        """
        if not TESSERACT_AVAILABLE:
            return "⚠️ OCR không khả dụng. Vui lòng cài đặt pytesseract và Tesseract OCR."

        try:
            # Read image
            if PIL_AVAILABLE:
                image = Image.open(file_path)
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
            else:
                return "⚠️ PIL/Pillow không khả dụng. Không thể xử lý hình ảnh."

            # Perform OCR
            text = pytesseract.image_to_string(image, lang='vie+eng')
            return text.strip()
        except Exception as e:
            print(f"❌ OCR error: {e}")
            return f"⚠️ Không thể đọc text từ hình ảnh: {str(e)}"

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF file

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text
        """
        if not PDF_AVAILABLE:
            return "⚠️ PyPDF2 không khả dụng. Không thể đọc PDF."

        try:
            text_parts = []
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        text = page.extract_text()
                        if text.strip():
                            text_parts.append(f"--- Trang {page_num + 1} ---\n{text}")
                    except Exception as e:
                        print(f"⚠️ Error reading page {page_num + 1}: {e}")
                        continue

            return "\n\n".join(text_parts) if text_parts else "⚠️ Không tìm thấy text trong PDF."
        except Exception as e:
            print(f"❌ PDF extraction error: {e}")
            return f"⚠️ Không thể đọc PDF: {str(e)}"

    def extract_text_from_docx(self, file_path: str) -> str:
        """
        Extract text from Word document (.docx)

        Args:
            file_path: Path to .docx file

        Returns:
            Extracted text
        """
        if not DOCX_AVAILABLE:
            return "⚠️ python-docx không khả dụng. Không thể đọc Word document."

        try:
            doc = Document(file_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n".join(paragraphs) if paragraphs else "⚠️ Không tìm thấy text trong document."
        except Exception as e:
            print(f"❌ DOCX extraction error: {e}")
            return f"⚠️ Không thể đọc Word document: {str(e)}"

    def extract_text_from_text_file(self, file_path: str) -> str:
        """
        Read text from plain text file

        Args:
            file_path: Path to text file

        Returns:
            File content
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    return f.read()
            except Exception as e:
                return f"⚠️ Không thể đọc file text: {str(e)}"
        except Exception as e:
            return f"⚠️ Không thể đọc file text: {str(e)}"

    def process_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, any]:
        """
        Process uploaded file and extract text content

        Args:
            file_content: File content as bytes
            filename: Original filename
            content_type: MIME type

        Returns:
            Dict with extracted text and metadata
        """
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        try:
            extracted_text = ""
            file_type = "unknown"

            if self.is_image(content_type):
                file_type = "image"
                extracted_text = self.extract_text_from_image(tmp_path)
            elif content_type == 'application/pdf':
                file_type = "pdf"
                extracted_text = self.extract_text_from_pdf(tmp_path)
            elif content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                file_type = "docx"
                extracted_text = self.extract_text_from_docx(tmp_path)
            elif content_type in ['text/plain', 'text/csv']:
                file_type = "text"
                extracted_text = self.extract_text_from_text_file(tmp_path)
            else:
                extracted_text = f"⚠️ Loại file {content_type} chưa được hỗ trợ."

            return {
                "filename": filename,
                "type": file_type,
                "content_type": content_type,
                "extracted_text": extracted_text,
                "size": len(file_content)
            }
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_path)
            except:
                pass

    def process_files(self, files: List[Tuple[bytes, str, str]]) -> List[Dict[str, any]]:
        """
        Process multiple files

        Args:
            files: List of tuples (file_content, filename, content_type)

        Returns:
            List of processed file results
        """
        results = []
        for file_content, filename, content_type in files:
            try:
                result = self.process_file(file_content, filename, content_type)
                results.append(result)
            except Exception as e:
                print(f"❌ Error processing file {filename}: {e}")
                results.append({
                    "filename": filename,
                    "type": "error",
                    "content_type": content_type,
                    "extracted_text": f"⚠️ Lỗi khi xử lý file: {str(e)}",
                    "size": len(file_content) if file_content else 0
                })
        return results


# Global instance
_file_processor = None

def get_file_processor() -> FileProcessor:
    """Get global file processor instance"""
    global _file_processor
    if _file_processor is None:
        _file_processor = FileProcessor()
    return _file_processor

