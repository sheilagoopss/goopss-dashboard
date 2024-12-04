"use client";
import React, { useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

interface DragDropUploadProp {
  handleUpload: (data: (string | UploadFile<File>)[]) => void;
  multiple?: boolean;
  rawFile?: boolean;
  placeholder?: string;
  width?: string;
}

const DragDropUpload: React.FC<DragDropUploadProp> = ({
  handleUpload,
  multiple = false,
  rawFile = false,
  placeholder = "Click or drag file to this area to upload",
  width = "100%",
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return Upload.LIST_IGNORE;
      }
      return false; 
    },
    onChange(info) {
      const newFileList = info.fileList.filter((file) => file.status !== "removed");

      setFileList(newFileList); 

      if (rawFile) {
        handleUpload(newFileList);
        setFileList([])
      } else {
        const base64Promises = newFileList.map((file) =>
          getBase64(file.originFileObj as File)
        );

        Promise.all(base64Promises)
          .then((base64Strings) => {
            handleUpload(base64Strings);
            setFileList([])
          })
          .catch((error) => {
            console.error("Failed to convert some files to base64.", error);
          });
      }

      if (info.file.status === "done") {
        console.log(`${info.file.name} file processed successfully.`);
      } else if (info.file.status === "error") {
        console.error(`${info.file.name} file processing failed.`);
      }
    },
    fileList, 
    showUploadList: false,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...props} style={{ width }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{placeholder}</p>
    </Dragger>
  );
};

export default DragDropUpload;
