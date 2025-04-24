import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import {
  CategoryDto,
  CreateProductDto,
  UpdateProductDto,
  ApiErrorResponse,
  ProductDto,
} from "../../types";
import styles from "./ProductForm.module.css";
import { useNavigate } from "react-router-dom";

const apiUrl = "/api";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

interface ProductFormProps {
  productId?: string;
  onSuccess: () => void;
}

type ProductFormData = Omit<
  CreateProductDto & Partial<UpdateProductDto>,
  "isAvailable"
>;

const ProductForm: React.FC<ProductFormProps> = ({ productId, onSuccess }) => {
  const isEditing = !!productId;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0.01,
    images: [],
    leadTimeInput: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<CategoryDto[]>(`${apiUrl}/categories`);
        setCategories(response.data);
        if (!isEditing && response.data.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: response.data[0].id }));
        }
      } catch (err) {
        setError("Could not load categories.");
      }
    };
    fetchCategories();
  }, [isEditing, formData.categoryId]);

  useEffect(() => {
    if (isEditing && productId) {
      setLoadingData(true);
      const fetchProduct = async () => {
        try {
          const response = await axios.get<ProductDto>(
            `${apiUrl}/products/${productId}`
          );
          const product = response.data;
          const existingUrls = product.images ?? [];
          setFormData({
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            images: existingUrls,
            leadTimeInput: product.leadTimeDisplay,
            categoryId: product.categoryId,
          });
          setImagePreviews(existingUrls);
        } catch (err) {
          console.error(`Failed to fetch product ${productId}`, err);
          setError("Could not load product data.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchProduct();
    }
  }, [isEditing, productId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      const newPreviews: string[] = [];
      const currentFiles = [...imageFiles];
      newFilesArray.forEach((file) => {
        if (
          !currentFiles.some(
            (f) => f.name === file.name && f.size === file.size
          )
        ) {
          currentFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });
      setImageFiles(currentFiles);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setUploadError(null);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const previewToRemove = imagePreviews[indexToRemove];

    const newPreviews = imagePreviews.filter(
      (_, index) => index !== indexToRemove
    );
    const newFiles = imageFiles.filter(
      (file) => URL.createObjectURL(file) !== previewToRemove
    );

    const currentImages = formData.images ?? [];
    const remainingExistingUrls = currentImages.filter(
      (url) => url !== previewToRemove
    );

    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    setFormData((prev) => ({ ...prev, images: remainingExistingUrls }));

    if (previewToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove);
    }
  };

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary config missing");
      setUploadError("Image upload configuration is missing.");
      return null;
    }
    const formDataCloudinary = new FormData();
    formDataCloudinary.append("file", file);
    formDataCloudinary.append("upload_preset", uploadPreset);
    try {
      const response = await axios.post(
        cloudinaryUploadUrl,
        formDataCloudinary,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.secure_url;
    } catch (err) {
      console.error(`Cloudinary upload failed for ${file.name}:`, err);
      const axiosError = err as AxiosError;
      const errorData = axiosError.response?.data as {
        error?: { message?: string };
      };
      setUploadError(
        (prev) =>
          prev ||
          `Upload failed for ${file.name}: ${
            errorData?.error?.message || axiosError.message
          }`
      );
      return null;
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const backendFieldName = name.charAt(0).toUpperCase() + name.slice(1);
    if (validationErrors[name] || validationErrors[backendFieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors[backendFieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadError(null);
    setValidationErrors({});

    const priceValue = parseFloat(String(formData.price));
    if (isNaN(priceValue) || priceValue <= 0) {
      setError("Price must be > 0.");
      setLoading(false);
      return;
    }
    if (!formData.categoryId) {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      setIsUploading(true);
      const uploadPromises = imageFiles.map((file) => uploadSingleFile(file));
      const results = await Promise.all(uploadPromises);
      setIsUploading(false);
      uploadedUrls = results.filter((url): url is string => url !== null);
      if (uploadedUrls.length !== imageFiles.length) {
        setError(
          "Some images failed to upload. Please check errors and try again."
        );
        setLoading(false);
        return;
      }
      setImageFiles([]);
    }

    const existingUrls = formData.images ?? [];
    const finalImageUrls = [...existingUrls, ...uploadedUrls];

    const productPayload = {
      name: formData.name || "",
      description: formData.description || "",
      price: priceValue,
      images: finalImageUrls,
      leadTimeInput: formData.leadTimeInput || "",
      categoryId: formData.categoryId || "",
    };

    try {
      if (isEditing && productId) {
        await axios.put(`${apiUrl}/products/${productId}`, productPayload);
      } else {
        await axios.post(`${apiUrl}/products`, productPayload);
      }
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "REACT: Product form submission failed:",
        axiosError.response?.data || axiosError.message
      );
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        setValidationErrors(axiosError.response.data.errors);
        setError("Please correct validation errors.");
      } else {
        setError(
          axiosError.response?.data?.detail ||
            axiosError.message ||
            "An unknown error occurred."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (
    fieldName: keyof ProductFormData
  ): string | undefined => {
    const key = fieldName as string;
    const pascalCaseName = key.charAt(0).toUpperCase() + key.slice(1);
    return validationErrors[key]?.[0] || validationErrors[pascalCaseName]?.[0];
  };

  if (loadingData) return <p>Loading product data...</p>;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{isEditing ? "Edit Product" : "Create New Product"}</h2>
      <div className={styles.formGroup}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        {getFieldError("name") && (
          <span className={styles.validationError}>
            {getFieldError("name")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="categoryId">Category</label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleInputChange}
          required
        >
          <option value="" disabled>
            -- Select Category --
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {getFieldError("categoryId") && (
          <span className={styles.validationError}>
            {getFieldError("categoryId")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="leadTimeInput">
          Lead Time (e.g., "2 days", "4 hours")
        </label>
        <input
          type="text"
          id="leadTimeInput"
          name="leadTimeInput"
          value={formData.leadTimeInput ?? ""}
          onChange={handleInputChange}
          placeholder='Ej: "2 days", "3 hours"'
        />
        {getFieldError("leadTimeInput") && (
          <span className={styles.validationError}>
            {getFieldError("leadTimeInput")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="product-images">Product Images (First is cover)</label>
        <input
          type="file"
          id="product-images"
          name="product-images"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          multiple
          onChange={handleFileChange}
          disabled={isUploading || loading}
          style={{ marginBottom: "10px" }}
        />
        {isUploading && <p>Uploading {imageFiles.length} image(s)...</p>}
        {uploadError && <p className={styles.error}>{uploadError}</p>}
        <div className={styles.imagePreviewContainer}>
          {imagePreviews.length === 0 && !isUploading && (
            <p>No images selected.</p>
          )}
          {imagePreviews.map((previewUrl, index) => (
            <div key={index} className={styles.imagePreviewItem}>
              <img
                src={previewUrl}
                alt={`Product image ${index + 1}`}
                className={styles.imagePreview}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className={styles.removeImageButton}
                disabled={isUploading || loading}
                title="Remove image"
              >
                {" "}
                &times;{" "}
              </button>
              {index === 0 && (
                <span className={styles.coverLabel}>(Cover)</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonContainer}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading || loadingData || isUploading}
        >
          {loading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Product"}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => navigate("/admin/products")}
          disabled={loading || isUploading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
