import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectPath } from '../utils/authUtils';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tokenExpiryWarning, setTokenExpiryWarning] = useState(false);
    const navigate = useNavigate();

    const decodeToken = (token) => {
        if (!token) {
            throw new Error('No token provided');
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token structure');
            }

            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = atob(base64);
            const decoded = JSON.parse(jsonPayload);

            // Debug log the decoded token
            console.log('Raw decoded token:', decoded);

            // Check if decoded token has required fields
            // Note: The server sends 'id' not '_id'
            if (!decoded || !decoded.id || !decoded.role) {
                console.log('Missing required fields in token:', decoded);
                throw new Error('Invalid token payload');
            }

            // Token already has the correct structure, just return it
            return {
                id: decoded.id,
                role: decoded.role.toLowerCase(),
                exp: decoded.exp
            };
        } catch (error) {
            console.error('Token decode error:', error);
            throw new Error('Invalid token format');
        }
    };

    const isTokenExpiringSoon = (decodedToken) => {
        if (!decodedToken?.exp) return false;
        const expiryTime = decodedToken.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        return timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
    };

    const checkTokenExpiration = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = decodeToken(token);
        if (!decoded) {
            logout();
            return;
        }

        const expiryTime = decoded.exp * 1000;
        const now = Date.now();

        if (now >= expiryTime) {
            logout();
            return;
        }

        if (isTokenExpiringSoon(decoded)) {
            setTokenExpiryWarning(true);
        } else {
            setTokenExpiryWarning(false);
        }
    };

    useEffect(() => {
        // Check active session
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Session error:', error);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    // Get user details from stored data or fetch from backend
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                    } else {
                        // If no stored user, try to fetch from backend
                        await refreshUser(session.access_token);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            } else if (event === 'TOKEN_REFRESHED') {
                const newToken = session?.access_token;
                if (newToken) {
                    localStorage.setItem('token', newToken);
                }
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const refreshUser = async (token) => {
        try {
            const response = await fetch('https://theervu-kaanal.onrender.com/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                const userData = {
                    ...data,
                    role: data.role.charAt(0).toUpperCase() + data.role.slice(1).toLowerCase()
                };
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    const updateUser = (newUserData) => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        const userData = {
            ...storedUser,
            ...newUserData,
            role: (newUserData.role || storedUser.role).charAt(0).toUpperCase() + (newUserData.role || storedUser.role).slice(1).toLowerCase()
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const login = async (email, password, department = null, employeeId = null, adminId = null) => {
        try {
            // Determine the endpoint based on the login type
            let endpoint;
            if (adminId) {
                endpoint = '/api/auth/admin/login';
            } else if (department) {
                endpoint = '/api/auth/official/login';
            } else {
                endpoint = '/api/auth/petitioner/login';
            }

            console.log('Attempting login:', { email, endpoint });

            // Extract email if it's an object
            const emailValue = typeof email === 'object' ? email.email : email;

            const response = await fetch(`https://theervu-kaanal.onrender.com${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailValue,
                    password,
                    ...(department && { department }),
                    ...(employeeId && { employeeId }),
                    ...(adminId && { adminId })
                })
            });

            const data = await response.json();
            console.log('Login response:', { success: response.ok, data });

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store Supabase token
            if (data.token) {
                console.log('Storing auth data...');
                localStorage.setItem('token', data.token);
                
                // Store refresh token if available
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }

                // Ensure user role is properly cased
                const userData = {
                    ...data.user,
                    role: data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1).toLowerCase()
                };
                console.log('Processed user data:', userData);

                // Store user data
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);

                // Navigate based on role
                const redirectPath = getRedirectPath(userData.role.toLowerCase(), userData.department);
                console.log('Redirecting to:', redirectPath);
                navigate(redirectPath);
            } else {
                throw new Error('No token received from server');
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();
            
            // Clear all auth-related data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Reset state
            setUser(null);
            setTokenExpiryWarning(false);

            // Navigate to login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleApiResponse = async (response) => {
        // Check for token expiration warning
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && isTokenExpiringSoon(decoded)) {
                setTokenExpiryWarning(true);
            }
        }

        if (!response.ok) {
            let errorMessage = 'An error occurred';
            try {
                const data = await response.json();
                // Handle specific error codes
                switch (data.code) {
                    case 'TOKEN_EXPIRED':
                    case 'TOKEN_INVALID':
                    case 'TOKEN_MISSING':
                    case 'USER_NOT_FOUND':
                        logout();
                        throw new Error('Session expired. Please log in again.');
                    default:
                        errorMessage = data.message || data.error || 'An error occurred';
                }
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || 'An error occurred';
            }
            throw new Error(errorMessage);
        }

        return response;
    };

    const authenticatedFetch = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        if (!token) {
            logout();
            throw new Error('No authentication token found');
        }

        // Check token expiration before making request
        const decoded = decodeToken(token);
        if (!decoded) {
            logout();
            throw new Error('Invalid token format');
        }

        if (decoded.exp * 1000 <= Date.now()) {
            logout();
            throw new Error('Session expired. Please log in again.');
        }

        // Ensure URL starts with backend server address
        const baseUrl = 'https://theervu-kaanal.onrender.com';
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Don't override Content-Type if FormData is being sent
        if (options.body instanceof FormData) {
            delete defaultHeaders['Content-Type'];
        }

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            // If unauthorized, try to refresh the token
            if (response.status === 401) {
                const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    const { token: newToken } = await refreshResponse.json();
                    localStorage.setItem('token', newToken);

                    // Retry the original request with new token
                    return fetch(fullUrl, {
                        ...options,
                        headers: {
                            ...defaultHeaders,
                            'Authorization': `Bearer ${newToken}`,
                            ...options.headers
                        }
                    });
                } else {
                    // If refresh fails, logout
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
            }

            return handleApiResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            if (error.message.includes('Session expired')) {
                logout();
            }
            throw error;
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const value = {
        user,
        loading,
        login,
        logout,
        authenticatedFetch,
        tokenExpiryWarning,
        refreshUser,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {tokenExpiryWarning && (
                <div className="fixed top-0 right-0 m-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                    <p>Your session is about to expire. Please save your work.</p>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;