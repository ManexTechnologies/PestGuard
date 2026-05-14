import './PestHistory.css';
import React, { useState, useEffect } from 'react';

interface PestReport {
    id: number;
    pest_name: string;
    pest_type: string;
    severity: string;
    location: string;
    description: string;
    created_at: string;
    image_url?: string;
}

const PestHistory: React.FC = () => {
    const [reports, setReports] = useState<PestReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            // Use the working PHP API
            const response = await fetch('http://localhost/pestguard/get_reports_api.php');
            const data = await response.json();
            
            console.log('Reports loaded:', data);
            
            if (data.success) {
                setReports(data.reports);
            } else {
                setError(data.message || 'Failed to load reports');
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Cannot connect to server. Please make sure XAMPP is running.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="pest-history-loading">
                <div className="loading-spinner"></div>
                <p>Loading your pest reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pest-history-error">
                <p>❌ {error}</p>
                <button onClick={fetchReports}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="pest-history-container">
            <div className="history-header">
                <h1>My Pest Reports</h1>
                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-label">Total Reports</span>
                        <span className="stat-value">{reports.length}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">High Severity</span>
                        <span className="stat-value">
                            {reports.filter(r => r.severity?.toLowerCase() === 'high').length}
                        </span>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="no-reports">
                    <p>No pest reports found.</p>
                    <p>Start by scanning a pest to create your first report.</p>
                </div>
            ) : (
                <div className="reports-list">
                    {reports.map((report) => (
                        <div key={report.id} className="report-item">
                            <div className="report-header">
                                <h3>{report.pest_name}</h3>
                                {report.severity && (
                                    <span className={`severity-badge ${report.severity.toLowerCase()}`}>
                                        {report.severity}
                                    </span>
                                )}
                            </div>
                            <div className="report-details">
                                {report.pest_type && (
                                    <p><strong>Type:</strong> {report.pest_type}</p>
                                )}
                                {report.location && report.location !== '' && (
                                    <p><strong>📍 Location:</strong> {report.location}</p>
                                )}
                                {report.description && (
                                    <p><strong>Description:</strong> {report.description}</p>
                                )}
                                <p className="report-date">
                                    <strong>Reported:</strong> {new Date(report.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PestHistory;

