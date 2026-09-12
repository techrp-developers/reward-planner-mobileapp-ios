import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// The resolved CMS routes are public and share the app's selected API host.
export const cmsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});
