import { traceClient } from './api.config';

export const traceService = {
                // Buscar anime por imagen (URL)
                searchByUrl: async (imageUrl) => {
                                try {
                                                const response = await traceClient.get(`/search?url=${encodeURIComponent(imageUrl)}`);
                                                return response.data;
                                } catch (error) {
                                                console.error('Error searching by image URL:', error);
                                                throw error;
                                }
                },

                // Buscar anime por archivo de imagen (Upload)
                searchByFile: async (imageFile) => {
                                const formData = new FormData();
                                formData.append('image', imageFile);

                                try {
                                                const response = await traceClient.post('/search', formData, {
                                                                headers: {
                                                                                'Content-Type': 'multipart/form-data',
                                                                },
                                                });
                                                return response.data;
                                } catch (error) {
                                                console.error('Error searching by image file:', error);
                                                throw error;
                                }
                }
};
