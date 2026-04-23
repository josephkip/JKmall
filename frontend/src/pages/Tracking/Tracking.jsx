import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { ordersAPI, deliveriesAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { Package, Phone, User, MapPin, Bike } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });

const riderIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830312.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
const destIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

const statusSteps = ['pending', 'paid', 'processing', 'out_for_delivery', 'delivered'];
const statusColors = { pending: '#f39c12', paid: '#3498db', processing: '#9b59b6', out_for_delivery: '#e67e22', delivered: '#27ae60', cancelled: '#e74c3c' };

const Tracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [riderPos, setRiderPos] = useState(null);
  const [loading, setLoading] = useState(true);

  const { on } = useSocket(id);

  useEffect(() => {
    const fetch = async () => {
      try {
        const oRes = await ordersAPI.getOne(id);
        setOrder(oRes.data.data);
        try {
          const dRes = await deliveriesAPI.get(id);
          setDelivery(dRes.data.data);
          if (dRes.data.data.current_lat) setRiderPos({ lat: parseFloat(dRes.data.data.current_lat), lng: parseFloat(dRes.data.data.current_lng) });
        } catch (e) { /* no delivery yet */ }
      } catch (err) { toast.error('Order not found'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const u1 = on('location_update', (d) => setRiderPos({ lat: d.lat, lng: d.lng }));
    const u2 = on('order_status_update', (d) => setOrder(prev => prev ? { ...prev, status: d.status } : prev));
    const u3 = on('delivery_assigned', (d) => { setDelivery(prev => ({ ...prev, ...d })); toast.success('Rider assigned!'); });
    return () => { u1(); u2(); u3(); };
  }, [id]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;
  if (!order) return <div className="container" style={{ padding: 50, textAlign: 'center' }}><h2>Order not found</h2></div>;

  const destLat = order.delivery_lat ? parseFloat(order.delivery_lat) : -1.2921;
  const destLng = order.delivery_lng ? parseFloat(order.delivery_lng) : 36.8219;
  const mapCenter = riderPos || { lat: destLat, lng: destLng };
  const currentStepIdx = statusSteps.indexOf(order.status);

  return (
    <div className="container fade-in" style={{ paddingTop: 30 }}>
      <h1 style={{ marginBottom: 5 }}><MapPin size={24} style={{ verticalAlign: 'middle' }} /> Order Tracking</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 25 }}>#{order.order_number}</p>

      {/* Status Timeline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30, overflowX: 'auto', padding: '10px 0' }}>
        {statusSteps.map((s, i) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= currentStepIdx ? 'var(--primary)' : 'var(--light)', color: i <= currentStepIdx ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', zIndex: 1 }}>{i <= currentStepIdx ? '✓' : i + 1}</div>
            <span style={{ fontSize: '0.75rem', marginTop: 5, textTransform: 'capitalize', color: i <= currentStepIdx ? 'var(--primary)' : 'var(--text-muted)' }}>{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 25 }}>
        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 450 }}>
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <Marker position={[destLat, destLng]} icon={destIcon}><Popup>Delivery Destination<br />{order.delivery_address}</Popup></Marker>
            {riderPos && (<>
              <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}><Popup><Bike size={16} /> Rider Location</Popup></Marker>
              <Polyline positions={[[riderPos.lat, riderPos.lng], [destLat, destLng]]} color="var(--primary)" dashArray="10" />
            </>)}
          </MapContainer>
        </div>

        {/* Details Panel */}
        <div>
          <div className="card" style={{ marginBottom: 15 }}>
            <h3>Order Details</h3>
            <div style={{ marginTop: 15 }}>
              <p><strong>Status:</strong> <span style={{ color: statusColors[order.status], fontWeight: 600, textTransform: 'capitalize' }}>{order.status.replace('_', ' ')}</span></p>
              <p style={{ marginTop: 8 }}><strong>Total:</strong> KES {parseFloat(order.total_amount).toLocaleString()}</p>
              <p style={{ marginTop: 8 }}><strong>Items:</strong> {order.items?.length}</p>
              <p style={{ marginTop: 8 }}><strong>Address:</strong> {order.delivery_address}</p>
            </div>
          </div>

          {delivery?.rider && (
            <div className="card">
              <h3><Bike size={18} style={{ verticalAlign: 'middle' }} /> Your Rider</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 15 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} /></div>
                <div>
                  <p style={{ fontWeight: 600 }}>{delivery.rider.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><Phone size={14} style={{ verticalAlign: 'middle' }} /> {delivery.rider.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracking;
