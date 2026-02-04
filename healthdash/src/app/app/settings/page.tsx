"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure practice hours, locations, and appointment rules.
        </p>
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>Practice details</CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="practiceName">Practice name</Label>
            <Input id="practiceName" defaultValue="Healthdash Dental" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="America/Los_Angeles" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>Scheduling rules</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <p className="font-medium text-foreground">Location conflicts</p>
              <p className="text-sm text-muted-foreground">
                Prevent double booking in the same room.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <p className="font-medium text-foreground">Auto-adjust duration</p>
              <p className="text-sm text-muted-foreground">
                Sync appointment end times with type defaults.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button className="w-fit">Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
