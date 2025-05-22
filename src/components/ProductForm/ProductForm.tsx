import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  DragEvent,
} from "react";
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
import {
  LuCloudUpload,
  LuTrash2,
  LuImagePlus,
  LuCircleX,
  LuSaveAll,
} from "react-icons/lu";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
} from "../../utils/validationUtils";

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
    price: 1,
    images: [],
    leadTimeInput: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [clientValidationErrors, setClientValidationErrors] = useState<
    Record<string, string>
  >({});

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const MAX_IMAGES = 14;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<CategoryDto[]>(`${apiUrl}/categories`);
        setCategories(response.data);
        if (!isEditing && response.data.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: response.data[0].id }));
        }
      } catch {
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
        } catch {
          setError("No se pudieron cargar los datos del producto.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchProduct();
    }
  }, [isEditing, productId]);

  const validateField = (name: keyof ProductFormData, value: any): string => {
    let errorMsg = "";
    switch (name) {
      case "name":
        errorMsg =
          validateRequired(value) ||
          validateMinLength(value, 3) ||
          validateMaxLength(value, 100);
        if (errorMsg) {
          if (errorMsg.includes("This field is required")) {
            return "El nombre del producto es requerido.";
          }
          if (errorMsg.includes("at least 3 characters")) {
            return "El nombre debe tener al menos 3 caracteres.";
          }
          if (errorMsg.includes("no more than 100 characters")) {
            return "El nombre no debe exceder los 100 caracteres.";
          }
          return errorMsg;
        }
        return "";
      case "price":
        if (validateRequired(String(value))) return "El precio es requerido.";
        const numPrice = parseFloat(String(value));
        if (isNaN(numPrice) || numPrice <= 0)
          return "El precio debe ser un número positivo.";
        return "";
      case "categoryId":
        return validateRequired(value) ? "Debe seleccionar una categoría." : "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof ProductFormData>).forEach((key) => {
      if (key === "description" || key === "images" || key === "leadTimeInput")
        return;

      const errorMsg = validateField(key, formData[key]);
      if (errorMsg) {
        errors[key] = errorMsg;
        isValid = false;
      }
    });
    setClientValidationErrors(errors);
    return isValid;
  };

  const processFiles = (filesToProcess: FileList | File[]) => {
    const newFilesArray = Array.isArray(filesToProcess)
      ? filesToProcess
      : Array.from(filesToProcess);
    if (newFilesArray.length === 0) return;

    const newLocalPreviews: string[] = [];
    const newLocalFiles: File[] = [];

    let currentTotalInPreview = imagePreviews.length;

    for (const file of newFilesArray) {
      if (currentTotalInPreview >= MAX_IMAGES) {
        setUploadError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
        break;
      }

      const isDuplicateInSession = imageFiles.some(
        (f) =>
          f.name === file.name &&
          f.size === file.size &&
          f.lastModified === file.lastModified
      );
      const isDuplicateInExistingPreviews = imagePreviews.some((p) => {
        if (p.startsWith("blob:")) {
          return false;
        }
        return false;
      });

      if (!isDuplicateInSession && !isDuplicateInExistingPreviews) {
        newLocalFiles.push(file);
        newLocalPreviews.push(URL.createObjectURL(file));
        currentTotalInPreview++;
      }
    }

    if (newLocalFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...newLocalFiles]);
      setImagePreviews((prev) => [...prev, ...newLocalPreviews]);
    }

    if (
      currentTotalInPreview >= MAX_IMAGES &&
      newLocalFiles.length < newFilesArray.length
    ) {
      setUploadError(
        `Se alcanzó el límite de ${MAX_IMAGES} imágenes. Algunas no fueron añadidas.`
      );
    } else if (uploadError && newLocalFiles.length > 0) {
      setUploadError(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (imagePreviews.length < MAX_IMAGES) {
      if (!isDragging) setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (imagePreviews.length < MAX_IMAGES) {
        processFiles(e.dataTransfer.files);
      } else {
        setUploadError(`Ya has alcanzado el límite de ${MAX_IMAGES} imágenes.`);
      }
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const previewToRemove = imagePreviews[indexToRemove];

    if (!previewToRemove.startsWith("blob:")) {
      setFormData((prev) => ({
        ...prev,
        images: (prev.images ?? []).filter((url) => url !== previewToRemove),
      }));
    } else {
      const fileIndex = imageFiles.findIndex(
        (file) => URL.createObjectURL(file) === previewToRemove
      );
      if (fileIndex > -1) {
        setImageFiles((prevFiles) =>
          prevFiles.filter((_, i) => i !== fileIndex)
        );
      }
      URL.revokeObjectURL(previewToRemove);
    }
    setImagePreviews((prevPreviews) =>
      prevPreviews.filter((_, index) => index !== indexToRemove)
    );
    if (imagePreviews.length - 1 < MAX_IMAGES) {
      setUploadError(null);
    }
  };

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) {
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

    const fieldNameTyped = name as keyof ProductFormData;
    if (clientValidationErrors[fieldNameTyped]) {
      setClientValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldNameTyped];
        return newErrors;
      });
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setUploadError(null);
    setClientValidationErrors({});

    if (!validateForm()) {
      setError("Por favor corrige los errores en el formulario.");
      return;
    }

    setLoading(true);

    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      setIsUploading(true);
      const uploadPromises = imageFiles.map((file) => uploadSingleFile(file));
      const results = await Promise.all(uploadPromises);
      setIsUploading(false);
      uploadedUrls = results.filter((url): url is string => url !== null);
      if (uploadedUrls.length !== imageFiles.length) {
        setError(
          "Algunas imágenes no se pudieron subir. Revisa los mensajes de error e intenta de nuevo."
        );
        setLoading(false);
        return;
      }
      setImageFiles([]);
    }
    const existingImageUrls = formData.images ?? [];
    const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

    const productPayload = {
      name: formData.name || "",
      description: formData.description || "",
      price: parseFloat(String(formData.price)),
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
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        const backendErrors = axiosError.response.data.errors;
        const formattedErrors: Record<string, string> = {};
        for (const key in backendErrors) {
          const frontendKey = key.charAt(0).toLowerCase() + key.slice(1);
          if (backendErrors[key] && backendErrors[key].length > 0) {
            formattedErrors[frontendKey] = backendErrors[key][0];
          }
        }
        setClientValidationErrors((prev) => ({ ...prev, ...formattedErrors }));
        setError(
          "Por favor corrige los errores de validación resaltados por el servidor."
        );
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

  const getClientFieldError = (
    fieldName: keyof ProductFormData
  ): string | undefined => {
    return clientValidationErrors[fieldName];
  };

  if (loadingData && isEditing)
    return (
      <div className={styles.formFeedback}>Cargando datos del producto...</div>
    );

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.productForm} noValidate>
        <h2 className={styles.formTitle}>
          {isEditing ? "Editar Producto" : "Crear Nuevo Producto"}
        </h2>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Información Básica</legend>
          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label htmlFor="name" className={styles.label}>
                Nombre del Producto
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`${styles.input} ${
                  getClientFieldError("name") ? styles.inputError : ""
                }`}
                aria-invalid={!!getClientFieldError("name")}
                aria-describedby={
                  getClientFieldError("name") ? "name-error" : undefined
                }
              />
              {getClientFieldError("name") && (
                <span id="name-error" className={styles.validationError}>
                  {getClientFieldError("name")}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.formGroupHalf}`}>
              <label htmlFor="price" className={styles.label}>
                Precio (Bs.)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className={`${styles.input} ${
                  getClientFieldError("price") ? styles.inputError : ""
                }`}
                aria-invalid={!!getClientFieldError("price")}
                aria-describedby={
                  getClientFieldError("price") ? "price-error" : undefined
                }
              />
              {getClientFieldError("price") && (
                <span id="price-error" className={styles.validationError}>
                  {getClientFieldError("price")}
                </span>
              )}
            </div>

            <div className={`${styles.formGroup} ${styles.formGroupHalf}`}>
              <label htmlFor="categoryId" className={styles.label}>
                Categoría
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className={`${styles.select} ${
                  getClientFieldError("categoryId") ? styles.inputError : ""
                }`}
                aria-invalid={!!getClientFieldError("categoryId")}
                aria-describedby={
                  getClientFieldError("categoryId")
                    ? "categoryId-error"
                    : undefined
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
              {getClientFieldError("categoryId") && (
                <span id="categoryId-error" className={styles.validationError}>
                  {getClientFieldError("categoryId")}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label htmlFor="description" className={styles.label}>
                Descripción (Opcional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description ?? ""}
                onChange={handleInputChange}
                rows={4}
                className={`${styles.textarea} ${
                  getClientFieldError("description") ? styles.inputError : ""
                }`}
                aria-invalid={!!getClientFieldError("description")}
                aria-describedby={
                  getClientFieldError("description")
                    ? "description-error"
                    : undefined
                }
              />
              {getClientFieldError("description") && (
                <span id="description-error" className={styles.validationError}>
                  {getClientFieldError("description")}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label htmlFor="leadTime" className={styles.label}>
                Antelación de Pedido (Días)
              </label>
              <select
                id="leadTime"
                name="leadTimeInput"
                onChange={handleInputChange}
                value={formData.leadTimeInput ?? ""}
                className={`${styles.select} ${
                  getClientFieldError("leadTimeInput") ? styles.inputError : ""
                }`}
              >
                <option value="">No requiere antelación</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={String(day)}>
                    {day} día{day > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              {getClientFieldError("leadTimeInput") && (
                <span className={styles.validationError}>
                  {getClientFieldError("leadTimeInput")}
                </span>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Multimedia</legend>
          <div className={styles.formGroup}>
            <label htmlFor="product-images-input" className={styles.label}>
              Imágenes del Producto (Máx. {MAX_IMAGES}, la primera será la
              portada)
            </label>
            <div
              className={`${styles.imageUploadArea} ${
                isDragging ? styles.dragging : ""
              } ${
                imagePreviews.length >= MAX_IMAGES
                  ? styles.disabledUploadArea
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <LuCloudUpload className={styles.uploadIcon} />
              <span className={styles.uploadText}>
                {imagePreviews.length >= MAX_IMAGES
                  ? "Límite de imágenes alcanzado"
                  : isDragging
                  ? "Suelta las imágenes aquí"
                  : "Arrastra y suelta imágenes aquí o"}
              </span>
              <input
                type="file"
                id="product-images-input"
                name="product-images"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                multiple
                onChange={handleFileChange}
                disabled={
                  isUploading || loading || imagePreviews.length >= MAX_IMAGES
                }
                className={styles.fileInput}
                aria-describedby="image-upload-instructions"
              />
              {imagePreviews.length < MAX_IMAGES && (
                <label
                  htmlFor="product-images-input"
                  className={styles.fileInputLabel}
                  role="button"
                >
                  <LuImagePlus /> Seleccionar Archivos
                </label>
              )}
              {imagePreviews.length >= MAX_IMAGES && !isUploading && (
                <p className={styles.maxImagesText}>
                  Has alcanzado el límite de {MAX_IMAGES} imágenes.
                </p>
              )}
            </div>

            {isUploading && (
              <div className={styles.formFeedback}>
                Subiendo {imageFiles.length} imagen(es)...
              </div>
            )}
            {uploadError && (
              <div className={`${styles.formFeedback} ${styles.errorText}`}>
                {uploadError}
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {imagePreviews.map((previewUrl, index) => (
                  <div
                    key={previewUrl + index}
                    className={styles.imagePreviewItem}
                  >
                    <img
                      src={previewUrl}
                      alt={`Previsualización ${index + 1}`}
                      className={styles.imagePreviewImg}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className={styles.removeImageButton}
                      disabled={isUploading || loading}
                      title="Quitar imagen"
                      aria-label={`Quitar imagen ${index + 1}`}
                    >
                      <LuTrash2 />
                    </button>
                    {index === 0 && (
                      <span className={styles.coverLabel}>Portada</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {imagePreviews.length === 0 && !isUploading && (
              <p className={styles.noImagesText}>
                Aún no has seleccionado imágenes.
              </p>
            )}
          </div>
        </fieldset>

        {error && (
          <div className={`${styles.formFeedback} ${styles.errorText}`}>
            {error}
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={`${styles.button} ${styles.submitButton}`}
            disabled={
              loading ||
              loadingData ||
              isUploading ||
              imagePreviews.length > MAX_IMAGES
            }
          >
            <LuSaveAll />
            {loading
              ? isEditing
                ? "Guardando Cambios..."
                : "Creando Producto..."
              : isEditing
              ? "Guardar Cambios"
              : "Crear Producto"}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={() => navigate("/admin/products")}
            disabled={loading || isUploading}
          >
            <LuCircleX /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
