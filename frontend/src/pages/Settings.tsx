import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, User, Bell, Key } from 'lucide-react';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, phone, city })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile updated' });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-4 w-4 text-accent" />
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-accent">Profile</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10 rounded-none border-border bg-secondary"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-10 rounded-none border-border bg-secondary"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 h-10 rounded-none border-border bg-secondary"
                placeholder="Mumbai"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-1 h-10 rounded-none border-border bg-secondary/50 text-muted-foreground"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-4 w-4 text-accent" />
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-accent">Account</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium uppercase text-accent">{profile?.plan || 'Free'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN') : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
