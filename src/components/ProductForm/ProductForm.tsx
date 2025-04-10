import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { CategoryDto, ProductDto, CreateProductDto, UpdateProductDto, ApiErrorResponse } from '../../types';
import styles from './ProductForm.module.css';
import { useNavigate } from 'react-router-dom';

const apiUrl = '/api';

interface ProductFormProps {
  productId?: string;
  onSuccess: () => void; 
}

const ProductForm: React.FC<ProductFormProps> = ({ productId, onSuccess }) => {
  const isEditing = !!productId;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<UpdateProductDto & CreateProductDto>>({
    name: '',
    description: '',
    price: 0.01,
    isAvailable: true,
    images: [],
    leadTimeInput: '',
    categoryId: '',
  });
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<CategoryDto[]>(`${apiUrl}/categories`);
        setCategories(response.data);
         if (!isEditing && response.data.length > 0) {
             setFormData(prev => ({ ...prev, categoryId: response.data[0].id }));
         }
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setError("Could not load categories for selection.");
      }
    };
    fetchCategories();
  }, [isEditing]);
  useEffect(() => {
    if (isEditing && productId) {
      setLoadingData(true);
      const fetchProduct = async () => {
        try {
          const response = await axios.get<ProductDto>(`${apiUrl}/products/${productId}`);
          const product = response.data;
          setFormData({
            name: product.name,
            description: product.description ?? '',
            price: product.price,
            isAvailable: product.isAvailable,
            images: product.images ?? [], 
            leadTimeInput: product.leadTimeDisplay, 
            categoryId: product.categoryId,
          });
        } catch (err) {
          console.error(`Failed to fetch product ${productId}`, err);
          setError("Could not load product data for editing.");
        } finally {
          setLoadingData(false);
        }
      };
      fetchProduct();
    }
  }, [isEditing, productId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked; 

    const backendFieldName = name.charAt(0).toUpperCase() + name.slice(1);
    if (validationErrors[name] || validationErrors[backendFieldName]) {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            delete newErrors[backendFieldName];
            return newErrors;
        });
    }


    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checkedValue : value,
    }));
  };

   const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            images: [e.target.value] 
        }))
   };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    const priceValue = parseFloat(String(formData.price)); 
    if (isNaN(priceValue) || priceValue <= 0) {
         setError("Price must be a valid number greater than 0.");
         setLoading(false);
         return;
    }
     if (!formData.categoryId) {
         setError("Please select a category.");
         setLoading(false);
         return;
     }

    const productData = {
        name: formData.name,
        description: formData.description,
        price: priceValue,
        isAvailable: formData.isAvailable ?? true, 
        images: formData.images?.filter(img => img) ?? [],
        leadTimeInput: formData.leadTimeInput,
        categoryId: formData.categoryId,
    };


    try {
      if (isEditing && productId) {
        console.log("REACT: Updating product", productId, productData);
        await axios.put(`${apiUrl}/products/${productId}`, productData);
        console.log("REACT: Product updated successfully");
      } else {
        console.log("REACT: Creating product", productData);
        await axios.post(`${apiUrl}/products`, productData);
        console.log("REACT: Product created successfully");
      }
      onSuccess();

    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error("REACT: Product form failed:", axiosError.response?.data || axiosError.message);
       if (axiosError.response?.status === 400 && axiosError.response.data?.errors) {
            setValidationErrors(axiosError.response.data.errors);
            setError("Please correct the validation errors.");
          } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
               setError("Authentication/Authorization error. Please login again.");
          }
          else {
            setError(axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.message || "An unknown error occurred.");
          }
    } finally {
      setLoading(false);
    }
  };

   const getFieldError = (fieldName: string): string | undefined => {
        const pascalCaseName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return validationErrors[fieldName]?.[0] || validationErrors[pascalCaseName]?.[0];
   };


  if (loadingData) {
      return <p>Loading product data...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{isEditing ? 'Edit Product' : 'Create New Product'}</h2>

      <div className={styles.formGroup}>
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
         {getFieldError('name') && <span className={styles.validationError}>{getFieldError('name')}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={formData.description ?? ''} onChange={handleInputChange} />
         {getFieldError('description') && <span className={styles.validationError}>{getFieldError('description')}</span>}
      </div>

       <div className={styles.formGroup}>
        <label htmlFor="price">Price</label>
        <input type="number" step="0.01" min="0.01" id="price" name="price" value={formData.price} onChange={handleInputChange} required />
         {getFieldError('price') && <span className={styles.validationError}>{getFieldError('price')}</span>}
      </div>

       <div className={styles.formGroup}>
         <label htmlFor="categoryId">Category</label>
         <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleInputChange} required >
             <option value="" disabled>-- Select Category --</option>
             {categories.map(cat => (
                 <option key={cat.id} value={cat.id}>{cat.name}</option>
             ))}
         </select>
          {getFieldError('categoryId') && <span className={styles.validationError}>{getFieldError('categoryId')}</span>}
      </div>

       <div className={styles.formGroup}>
        <label htmlFor="leadTimeInput">Lead Time (e.g., "2 days", "4 hours")</label>
        <input type="text" id="leadTimeInput" name="leadTimeInput" value={formData.leadTimeInput ?? ''} onChange={handleInputChange} placeholder='Ej: "2 days", "3 hours"'/>
         {getFieldError('leadTimeInput') && <span className={styles.validationError}>{getFieldError('leadTimeInput')}</span>}
      </div>

        <div className={styles.formGroup}>
         <label htmlFor="image-url">Image URL</label>
         <input type="url" id="image-url" name="images" value={formData.images?.[0] ?? ''} onChange={handleImageChange} placeholder="https://example.com/image.jpg" />
         {getFieldError('images') && <span className={styles.validationError}>{getFieldError('images')}</span>}
          {formData.images?.[0] && <img src={formData.images[0]} alt="Preview" className={styles.imagePreview} />}
      </div>

       {isEditing && (
         <div className={styles.checkboxGroup}>
           <input type="checkbox" id="isAvailable" name="isAvailable" checked={formData.isAvailable ?? true} onChange={handleInputChange} />
           <label htmlFor="isAvailable">Is Available?</label>
           {getFieldError('isAvailable') && <span className={styles.validationError}>{getFieldError('isAvailable')}</span>}
         </div>
       )}


      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.buttonContainer}>
           <button type="submit" className={styles.submitButton} disabled={loading || loadingData}>
             {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Product')}
           </button>
            <button type="button" className={styles.cancelButton} onClick={() => navigate('/admin/products')} disabled={loading}>
             Cancel
           </button>
       </div>

    </form>
  );
};

export default ProductForm;