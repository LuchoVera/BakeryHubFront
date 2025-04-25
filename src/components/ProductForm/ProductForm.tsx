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
        setError("No se pudieron cargar las categorías.");
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
            leadTimeInput: product.leadTimeDisplay ?? "",
            categoryId: product.categoryId,
          });
          setImagePreviews(existingUrls);
        } catch (err) {
          console.error(`Failed to fetch product ${productId}`, err);
          setError("No se pudieron cargar los datos del producto.");
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

    const newFiles = imageFiles.filter((_, index) => index !== indexToRemove);

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
      setUploadError("Falta configuración para subir imágenes.");
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
          `Fallo al subir ${file.name}: ${
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
      setError("El precio debe ser mayor a 0.");
      setLoading(false);
      return;
    }
    if (!formData.categoryId) {
      setError("Por favor selecciona una categoría.");
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
        setError("Algunas imágenes no se pudieron subir.");
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
        "REACT: Fallo envío formulario producto:",
        axiosError.response?.data || axiosError.message
      );
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        setValidationErrors(axiosError.response.data.errors);
        setError("Por favor corrige los errores de validación.");
      } else {
        setError(
          axiosError.response?.data?.detail ||
            axiosError.response?.data?.message ||
            "Ocurrió un error desconocido."
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

  if (loadingData) return <p>Cargando datos del producto...</p>;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{isEditing ? "Editar Producto" : "Crear Nuevo Producto"}</h2>

      <div className={styles.formGroup}>
        <label htmlFor="name">Nombre</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          aria-invalid={!!getFieldError("name")}
          aria-describedby={getFieldError("name") ? "name-error" : undefined}
        />
        {getFieldError("name") && (
          <span id="name-error" className={styles.validationError}>
            {getFieldError("name")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          value={formData.description ?? ""}
          onChange={handleInputChange}
          rows={4}
          aria-invalid={!!getFieldError("description")}
          aria-describedby={
            getFieldError("description") ? "description-error" : undefined
          }
        />
        {getFieldError("description") && (
          <span id="description-error" className={styles.validationError}>
            {getFieldError("description")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="price">Precio</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
          aria-invalid={!!getFieldError("price")}
          aria-describedby={getFieldError("price") ? "price-error" : undefined}
        />
        {getFieldError("price") && (
          <span id="price-error" className={styles.validationError}>
            {getFieldError("price")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="categoryId">Categoría</label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleInputChange}
          required
          aria-invalid={!!getFieldError("categoryId")}
          aria-describedby={
            getFieldError("categoryId") ? "categoryId-error" : undefined
          }
        >
          <option value="" disabled>
            -- Selecciona Categoría --
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {getFieldError("categoryId") && (
          <span id="categoryId-error" className={styles.validationError}>
            {getFieldError("categoryId")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="leadTime">Tiempo de Preparación (Días)</label>
        <select
          id="leadTime"
          name="leadTimeInput"
          onChange={handleInputChange}
          value={formData.leadTimeInput ?? ""}
        >
          <option value="">Ninguno</option>{" "}
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={String(day)}>
              {day} día{day > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        {getFieldError("leadTimeInput") && (
          <span className={styles.validationError}>
            {getFieldError("leadTimeInput")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="product-images">
          Imágenes del Producto (Primera es portada)
        </label>
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
        {isUploading && <p>Subiendo {imageFiles.length} imagen(es)...</p>}
        {uploadError && <p className={styles.error}>{uploadError}</p>}
        <div className={styles.imagePreviewContainer}>
          {imagePreviews.length === 0 && !isUploading && (
            <p>No hay imágenes seleccionadas.</p>
          )}
          {imagePreviews.map((previewUrl, index) => (
            <div key={index} className={styles.imagePreviewItem}>
              <img
                src={previewUrl}
                alt={`Imagen de producto ${index + 1}`}
                className={styles.imagePreview}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className={styles.removeImageButton}
                disabled={isUploading || loading}
                title="Quitar imagen"
              >
                {" "}
                &times;{" "}
              </button>
              {index === 0 && (
                <span className={styles.coverLabel}>(Portada)</span>
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
              ? "Guardando..."
              : "Creando..."
            : isEditing
            ? "Guardar Cambios"
            : "Crear Producto"}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => navigate("/admin/products")}
          disabled={loading || isUploading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
