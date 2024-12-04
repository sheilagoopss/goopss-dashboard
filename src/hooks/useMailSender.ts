import { IMail } from "@/types/Mail";
import { endpoints } from "@/constants/endpoints";
import { useState, useCallback } from "react";
import HttpHelper from "@/helpers/HttpHelper";

const useMailSender = () => {
  const [isSendingMail, setIsSendingMail] = useState(false);

  const sendMail = useCallback(async (mail: IMail) => {
    setIsSendingMail(true);
    try {
      const response = await HttpHelper.post(endpoints.mailSender.sendMail, {
        data: mail,
      });
      return response?.data;
    } catch (error) {
      console.error("Error sending mail:", error);
    } finally {
      setIsSendingMail(false);
    }
  }, []);

  return { sendMail, isSendingMail };
};

export default useMailSender;
