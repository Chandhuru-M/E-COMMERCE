import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function AdminSettings() {
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        checkConfigStatus();
    }, []);

    const checkConfigStatus = async () => {
        try {
            const { data } = await axios.get('/api/v1/admin/config');
            setHasKey(data.hasGeminiKey);
        } catch (error) {
            console.error(error);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await axios.put('/api/v1/admin/config/gemini', { geminiApiKey });
            toast.success(data.message);
            setHasKey(true);
            setGeminiApiKey(''); // Clear input for security
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12 col-md-2">
                <Sidebar />
            </div>
            <div className="col-12 col-md-10">
                <div className="wrapper my-5"> 
                    <div className="col-10 col-lg-5 shadow-lg p-5 mx-auto">
                        <form onSubmit={submitHandler}>
                            <h1 className="mb-4">Admin Settings</h1>

                            <div className="form-group">
                                <label htmlFor="gemini_field">Gemini API Key</label>
                                <div className="input-group">
                                    <input
                                        type="password"
                                        id="gemini_field"
                                        className="form-control"
                                        value={geminiApiKey}
                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                        placeholder="Enter new Gemini API Key"
                                        required
                                    />
                                </div>
                                <small className="form-text text-muted mt-2">
                                    Status: {hasKey ? <span className="text-success">Key Configured ✅</span> : <span className="text-danger">Key Not Set ❌</span>}
                                </small>
                                <small className="d-block text-muted mt-1">
                                    Updating this will immediately change the key used by the AI Assistant without restarting the server.
                                </small>
                            </div>

                            <button
                                id="update_button"
                                type="submit"
                                className="btn btn-block py-3 mt-4 btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Update Key'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
