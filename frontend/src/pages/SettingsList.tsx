import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function SettingsList() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const api = useApi();
  
  const [settings, setSettings] = useState({
    school_name: 'ZP High School',
    academic_year: '2023-2024',
    features_enabled: {
      transport: true,
      hostel: true,
      library: true,
      inventory: true
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.fetchApi('/system/settings');
      if (data) {
        setSettings({
          school_name: data.school_name || 'ZP High School',
          academic_year: data.academic_year || '2023-2024',
          features_enabled: data.features_enabled || {
            transport: true,
            hostel: true,
            library: true,
            inventory: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.fetchApi('/system/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (feat: keyof typeof settings.features_enabled) => {
    setSettings({
      ...settings,
      features_enabled: {
        ...settings.features_enabled,
        [feat]: !settings.features_enabled[feat]
      }
    });
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  if (role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Only Super Admins can configure system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Configure global institutional parameters and feature flags.</p>
      </div>

      <div className="glass-panel border rounded-xl p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Institution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School Name</label>
              <input 
                type="text" 
                className="w-full bg-background/50 border rounded-md p-2 text-sm" 
                value={settings.school_name}
                onChange={(e) => setSettings({...settings, school_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <input 
                type="text" 
                className="w-full bg-background/50 border rounded-md p-2 text-sm" 
                value={settings.academic_year}
                onChange={(e) => setSettings({...settings, academic_year: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Module Flags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Feature Toggles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(settings.features_enabled) as Array<keyof typeof settings.features_enabled>).map((feat) => (
              <label key={feat} className="flex items-center space-x-2 text-sm capitalize">
                <input 
                  type="checkbox" 
                  checked={settings.features_enabled[feat]} 
                  onChange={() => handleFeatureToggle(feat)}
                  className="rounded text-primary focus:ring-primary" 
                />
                <span>{feat} Enabled</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
