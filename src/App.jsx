import { useState, useEffect } from 'react'
import { Upload, FileText, TrendingUp, DollarSign, Trash2, Calendar, AlertCircle, BarChart3, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [invoices, setInvoices] = useState([])
  const [monthlyStats, setMonthlyStats] = useState([])
  const [noVatInvoices, setNoVatInvoices] = useState([])
  const [revenueStats, setRevenueStats] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchInvoices()
    fetchMonthlyStats()
    fetchNoVatInvoices()
    fetchRevenueStats()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/invoices/`)
      setInvoices(response.data.invoices || [])
    } catch (error) {
      console.error('Erreur chargement factures:', error)
    }
  }

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/monthly`)
      setMonthlyStats(response.data.months || [])
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const fetchNoVatInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/invoices/no-vat`)
      setNoVatInvoices(response.data.invoices || [])
    } catch (error) {
      console.error('Erreur chargement sans TVA:', error)
    }
  }

  const fetchRevenueStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/revenue`)
      setRevenueStats(response.data)
    } catch (error) {
      console.error('Erreur chargement CA:', error)
    }
  }

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await axios.post(`${API_URL}/api/invoices/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (error) {
        console.error('Erreur upload:', error)
        alert(`Erreur lors de l'upload de ${file.name}`)
      }
    }
    setIsUploading(false)
    fetchInvoices()
    fetchMonthlyStats()
    fetchNoVatInvoices()
    fetchRevenueStats()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files)
  }

  const handleTogglePaid = async (invoiceId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/api/invoices/${invoiceId}`, {
        is_paid: !currentStatus
      })
      fetchInvoices()
      fetchRevenueStats()
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error)
    }
  }

  const handleDelete = async (invoiceId) => {
    if (!confirm('Supprimer cette facture ?')) return
    try {
      await axios.delete(`${API_URL}/api/invoices/${invoiceId}`)
      fetchInvoices()
      fetchMonthlyStats()
      fetchNoVatInvoices()
      fetchRevenueStats()
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const totalTTC = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount_ttc || 0), 0)
  const totalVAT = invoices.reduce((sum, inv) => {
    const vat = inv.vat_details.reduce((s, v) => s + parseFloat(v.amount || 0), 0)
    return sum + vat
  }, 0)

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <FileText size={32} />
            <div>
              <h1>Invoice OCR Pro</h1>
              <p>Extraction intelligente de factures</p>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-export">Exporter Excel</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#6366F120' }}>
              <FileText size={24} color="#6366F1" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Factures</p>
              <p className="stat-value">{invoices.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#10B98120' }}>
              <DollarSign size={24} color="#10B981" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total TTC</p>
              <p className="stat-value">{totalTTC.toFixed(2)} €</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#F59E0B20' }}>
              <TrendingUp size={24} color="#F59E0B" />
            </div>
            <div className="stat-content">
              <p className="stat-label">TVA Collectée</p>
              <p className="stat-value">{totalVAT.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FileText size={18} />
            Toutes les factures ({invoices.length})
          </button>
          <button 
            className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <BarChart3 size={18} />
            Chiffre d'Affaires
          </button>
          <button 
            className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <Calendar size={18} />
            Récap mensuel
          </button>
          <button 
            className={`tab ${activeTab === 'no-vat' ? 'active' : ''}`}
            onClick={() => setActiveTab('no-vat')}
          >
            <AlertCircle size={18} />
            Factures hors TVA ({noVatInvoices.length})
          </button>
        </div>

        {invoices.length === 0 && (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={48} />
            <h2>Glissez vos factures ici</h2>
            <p>PDF, PNG, JPG • Max 10 Mo</p>
            <label className="btn-upload">
              Parcourir les fichiers
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </label>
            {isUploading && <p className="uploading">⏳ Upload en cours...</p>}
          </div>
        )}

        {invoices.length > 0 && (
          <>
            {activeTab === 'all' && (
              <>
                <div className="section-header">
                  <h2>Mes Factures ({invoices.length})</h2>
                  <label className="btn-add">
                    + Ajouter
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileInput}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div className="invoices-grid">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className={`invoice-card ${invoice.is_paid ? 'paid' : ''}`}>
                      {invoice.is_paid && <div className="paid-badge">PAYÉ</div>}
                      
                      <div className="invoice-header">
                        <h3>{invoice.supplier || 'Fournisseur inconnu'}</h3>
                        <span className="invoice-amount">
                          {parseFloat(invoice.amount_ttc || 0).toFixed(2)} €
                        </span>
                      </div>

                      <div className="invoice-meta">
                        <span>📅 {invoice.date || 'Date inconnue'}</span>
                        <span>#{invoice.number || '-'}</span>
                      </div>

                      <div className="invoice-vat">
                        {invoice.vat_details.length > 0 ? (
                          invoice.vat_details.map((vat, idx) => (
                            <div key={idx} className="vat-line">
                              <span>TVA {parseFloat(vat.rate).toFixed(1)}%</span>
                              <span>{parseFloat(vat.amount).toFixed(2)} €</span>
                            </div>
                          ))
                        ) : (
                          <div className="vat-line">
                            <span className="text-muted">TVA non détectée</span>
                          </div>
                        )}
                      </div>

                      <div className="invoice-footer">
                        <div className="payment-toggle">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={invoice.is_paid}
                              onChange={() => handleTogglePaid(invoice.id, invoice.is_paid)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className="toggle-label">
                            {invoice.is_paid ? 'Payée' : 'Non payée'}
                          </span>
                        </div>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'revenue' && revenueStats && (
              <>
                <div className="section-header">
                  <h2>💰 Chiffre d'Affaires</h2>
                </div>

                <div className="revenue-stats-grid">
                  <div className="revenue-card">
                    <div className="revenue-icon" style={{ backgroundColor: '#10B98120' }}>
                      <CheckCircle size={32} color="#10B981" />
                    </div>
                    <div className="revenue-content">
                      <p className="revenue-label">CA Encaissé</p>
                      <p className="revenue-value">{revenueStats.total_revenue.toFixed(2)} €</p>
                      <p className="revenue-detail">{revenueStats.paid_count} factures payées</p>
                    </div>
                  </div>

                  <div className="revenue-card">
                    <div className="revenue-icon" style={{ backgroundColor: '#F59E0B20' }}>
                      <Clock size={32} color="#F59E0B" />
                    </div>
                    <div className="revenue-content">
                      <p className="revenue-label">CA en Attente</p>
                      <p className="revenue-value pending">{revenueStats.total_pending.toFixed(2)} €</p>
                      <p className="revenue-detail">{revenueStats.unpaid_count} factures impayées</p>
                    </div>
                  </div>

                  <div className="revenue-card">
                    <div className="revenue-icon" style={{ backgroundColor: '#6366F120' }}>
                      <TrendingUp size={32} color="#6366F1" />
                    </div>
                    <div className="revenue-content">
                      <p className="revenue-label">Taux de Paiement</p>
                      <p className="revenue-value">{revenueStats.payment_rate}%</p>
                      <p className="revenue-detail">Factures encaissées</p>
                    </div>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-container">
                    <h3>📊 CA Mensuel (Factures Payées)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueStats.monthly_revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                        <XAxis dataKey="month" stroke="#A0A0A0" />
                        <YAxis stroke="#A0A0A0" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #2D2D2D' }}
                          labelStyle={{ color: '#FFFFFF' }}
                        />
                        <Bar dataKey="revenue" fill="#10B981" name="CA (€)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h3>📈 Évolution du CA</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueStats.monthly_revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                        <XAxis dataKey="month" stroke="#A0A0A0" />
                        <YAxis stroke="#A0A0A0" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #2D2D2D' }}
                          labelStyle={{ color: '#FFFFFF' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} name="CA (€)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {revenueStats.top_suppliers.length > 0 && (
                  <div className="top-suppliers">
                    <h3>🏆 Top 5 Fournisseurs (CA Payé)</h3>
                    <div className="suppliers-list">
                      {revenueStats.top_suppliers.map((supplier, idx) => (
                        <div key={idx} className="supplier-item">
                          <div className="supplier-rank">#{idx + 1}</div>
                          <div className="supplier-name">{supplier.supplier}</div>
                          <div className="supplier-revenue">{supplier.revenue.toFixed(2)} €</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'monthly' && (
              <>
                <div className="section-header">
                  <h2>📊 Récapitulatif Mensuel TVA</h2>
                </div>

                <div className="monthly-table-container">
                  <table className="monthly-table">
                    <thead>
                      <tr>
                        <th>Mois</th>
                        <th>Nb Factures</th>
                        <th>Total HT</th>
                        <th className="highlight">TVA Facturée</th>
                        <th>Total TTC</th>
                        <th>Avec TVA</th>
                        <th>Sans TVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((month) => (
                        <tr key={month.month_key}>
                          <td className="month-cell">{month.month}</td>
                          <td>{month.invoices_count}</td>
                          <td>{month.total_ht.toFixed(2)} €</td>
                          <td className="highlight-cell">{month.vat_collected.toFixed(2)} €</td>
                          <td>{month.total_ttc.toFixed(2)} €</td>
                          <td>
                            <span className="badge badge-success">{month.invoices_with_vat}</span>
                          </td>
                          <td>
                            <span className="badge badge-warning">{month.invoices_without_vat}</span>
                          </td>
                        </tr>
                      ))}
                      {monthlyStats.length === 0 && (
                        <tr>
                          <td colSpan="7" className="empty-state">
                            Aucune donnée mensuelle disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {monthlyStats.length > 0 && (
                      <tfoot>
                        <tr className="total-row">
                          <td><strong>TOTAL</strong></td>
                          <td><strong>{monthlyStats.reduce((s, m) => s + m.invoices_count, 0)}</strong></td>
                          <td><strong>{monthlyStats.reduce((s, m) => s + m.total_ht, 0).toFixed(2)} €</strong></td>
                          <td className="highlight-cell">
                            <strong>{monthlyStats.reduce((s, m) => s + m.vat_collected, 0).toFixed(2)} €</strong>
                          </td>
                          <td><strong>{monthlyStats.reduce((s, m) => s + m.total_ttc, 0).toFixed(2)} €</strong></td>
                          <td><strong>{monthlyStats.reduce((s, m) => s + m.invoices_with_vat, 0)}</strong></td>
                          <td><strong>{monthlyStats.reduce((s, m) => s + m.invoices_without_vat, 0)}</strong></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}

            {activeTab === 'no-vat' && (
              <>
                <div className="section-header">
                  <h2>⚠️ Factures Hors TVA ({noVatInvoices.length})</h2>
                </div>

                {noVatInvoices.length === 0 ? (
                  <div className="empty-section">
                    <AlertCircle size={48} color="var(--text-tertiary)" />
                    <h3>Aucune facture sans TVA</h3>
                    <p>Toutes vos factures contiennent de la TVA</p>
                  </div>
                ) : (
                  <div className="invoices-grid">
                    {noVatInvoices.map((invoice) => (
                      <div key={invoice.id} className="invoice-card no-vat-card">
                        <div className="no-vat-badge">Sans TVA</div>
                        <div className="invoice-header">
                          <h3>{invoice.supplier || 'Fournisseur inconnu'}</h3>
                          <span className="invoice-amount">
                            {parseFloat(invoice.amount_ttc || 0).toFixed(2)} €
                          </span>
                        </div>

                        <div className="invoice-meta">
                          <span>📅 {invoice.date || 'Date inconnue'}</span>
                          <span>#{invoice.number || '-'}</span>
                        </div>

                        <div className="invoice-vat">
                          <div className="vat-line">
                            <span className="text-muted">⚠️ TVA non applicable</span>
                          </div>
                        </div>

                        <div className="invoice-footer">
                          <div className="payment-toggle">
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={invoice.is_paid}
                                onChange={() => handleTogglePaid(invoice.id, invoice.is_paid)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                            <span className="toggle-label">
                              {invoice.is_paid ? 'Payée' : 'Non payée'}
                            </span>
                          </div>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
