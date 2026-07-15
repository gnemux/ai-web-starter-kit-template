"use client";

import { useState } from "react";
import { Button, Dialog } from "@xwlc/ui";
import { signOut } from "@/modules/platform/auth/actions";

type Labels = {
  cancel: string;
  closeDialog: string;
  confirm: string;
  description: string;
  signOut: string;
  title: string;
};

export function AccountSignOut({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} variant="secondary">{labels.signOut}</Button>
    <Dialog closeLabel={labels.closeDialog} open={open} onOpenChange={setOpen} title={labels.title} description={labels.description}>
      <div className="actions">
        <Button onClick={() => setOpen(false)} variant="ghost">{labels.cancel}</Button>
        <form action={signOut}><Button type="submit" variant="danger">{labels.confirm}</Button></form>
      </div>
    </Dialog>
  </>;
}
