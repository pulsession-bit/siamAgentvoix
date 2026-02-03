import { useState, useCallback } from 'react';
import { AppStep, VisaType, AuditResult, CallPayload } from '../types';

interface UseAuditReturn {
  step: AppStep;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  visaType: VisaType;
  setVisaType: React.Dispatch<React.SetStateAction<VisaType>>;
  auditResult: AuditResult | null;
  setAuditResult: React.Dispatch<React.SetStateAction<AuditResult | null>>;
  callPayload: CallPayload | null;
  setCallPayload: React.Dispatch<React.SetStateAction<CallPayload | null>>;
  handleVisaSelect: (type: VisaType) => void;
  requestCall: (customPayload?: Partial<CallPayload>) => void;
  updateAuditFromResponse: (result: AuditResult) => void;
}

export function useAudit(): UseAuditReturn {
  const [step, setStep] = useState<AppStep>(AppStep.QUALIFICATION);
  const [visaType, setVisaType] = useState<VisaType>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [callPayload, setCallPayload] = useState<CallPayload | null>(null);

  const handleVisaSelect = useCallback((type: VisaType) => {
    setVisaType(type);
    setStep(AppStep.AUDIT);
  }, []);

  const requestCall = useCallback((customPayload?: Partial<CallPayload>) => {
    setCallPayload({
      reason: customPayload?.reason || 'user_request',
      visaType: customPayload?.visaType || visaType || 'Non Défini',
      userStage: customPayload?.userStage || step,
      notes: customPayload?.notes || "Demande manuelle de l'utilisateur.",
    });
  }, [visaType, step]);

  const updateAuditFromResponse = useCallback((result: AuditResult) => {
    setAuditResult(result);
    if (result.ready_for_payment) {
      setStep(AppStep.PAYMENT);
    }
  }, []);

  return {
    step,
    setStep,
    visaType,
    setVisaType,
    auditResult,
    setAuditResult,
    callPayload,
    setCallPayload,
    handleVisaSelect,
    requestCall,
    updateAuditFromResponse,
  };
}
