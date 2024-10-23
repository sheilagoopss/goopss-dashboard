import React from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

interface DragDropUploadProp {
  handleUpload: (data: string[]) => void;
  multiple?: boolean; // Optional boolean prop to control multiple file uploads
}

const DragDropUpload: React.FC<DragDropUploadProp> = ({
  handleUpload,
  multiple = false,
}) => {
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const props: UploadProps = {
    name: "file",
    multiple: multiple,
    accept: ".png,.jpg",
    maxCount: 1,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error({
          content: "You can only upload image files!",
        });
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange(info) {
      const { fileList } = info;
      const base64Promises = fileList
        .filter((file) => file.status !== "removed")
        .map((file) => getBase64(file.originFileObj as File));

      Promise.all(base64Promises)
        .then((base64Strings) => {
          handleUpload(base64Strings);
        })
        .catch(() => {
          console.error("Failed to convert some files to base64.");
        });

      if (info.file.status === "done") {
        console.log(`${info.file.name} file processed successfully.`);
      } else if (info.file.status === "error") {
        console.error(`${info.file.name} file processing failed.`);
      }
    },
    showUploadList: false,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
    </Dragger>
  );
};

export default DragDropUpload;
