/**
 * 密钥恢复对话框组件
 * 供 FatalErrorScreen 和 Toast 恢复流程共用
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importMasterKeyWithValidation } from "@/store/keyring/masterKey";
import { toastQueue } from "@/services/toast";
import { AlertTriangle, Loader2 } from "lucide-react";

interface KeyRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogState = "input" | "importing" | "mismatch" | "error";

/**
 * 密钥恢复对话框
 */
export const KeyRecoveryDialog: React.FC<KeyRecoveryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const [keyInput, setKeyInput] = useState("");
  const [state, setState] = useState<DialogState>("input");
  const [errorMessage, setErrorMessage] = useState("");

  const handleClose = () => {
    if (state !== "importing") {
      setState("input");
      setKeyInput("");
      setErrorMessage("");
      onOpenChange(false);
    }
  };

  const handleImport = async (force = false) => {
    const trimmedKey = keyInput.trim();
    if (!trimmedKey) return;

    setState("importing");

    try {
      const result = await importMasterKeyWithValidation(trimmedKey, force);

      if (result.success) {
        toastQueue.success(t(($) => $.common.keyRecovery.importSuccess));
        onOpenChange(false);
        window.location.reload();
        return;
      }

      if (result.keyMatched === false) {
        setState("mismatch");
        return;
      }

      setState("error");
      setErrorMessage(result.error || t(($) => $.common.keyRecovery.mismatchWarning));
    } catch {
      setState("error");
      setErrorMessage(t(($) => $.common.keyRecovery.importFailed));
    }
  };

  const isDisabled = state === "importing" || !keyInput.trim();

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(($) => $.common.keyRecovery.title)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(($) => $.common.keyRecovery.description)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <Input
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              if (state === "error") setState("input");
            }}
            placeholder={t(($) => $.common.keyRecovery.placeholder)}
            className="font-mono text-sm"
            disabled={state === "importing"}
          />

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t(($) => $.common.keyRecovery.securityWarning)}
            </AlertDescription>
          </Alert>

          {state === "mismatch" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t(($) => $.common.keyRecovery.mismatchWarning)}
              </AlertDescription>
            </Alert>
          )}

          {state === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={state === "importing"}
          >
            {state === "mismatch"
              ? t(($) => $.common.keyRecovery.cancel)
              : t(($) => $.common.cancel)}
          </Button>

          {state === "mismatch" ? (
            <Button onClick={() => handleImport(true)}>
              {t(($) => $.common.keyRecovery.forceImport)}
            </Button>
          ) : (
            <Button onClick={() => handleImport(false)} disabled={isDisabled}>
              {state === "importing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {state === "importing"
                ? t(($) => $.common.keyRecovery.importing)
                : t(($) => $.common.keyRecovery.importButton)}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
