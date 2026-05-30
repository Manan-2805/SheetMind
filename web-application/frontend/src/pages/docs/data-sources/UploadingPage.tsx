import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import {
  Callout,
  DocCode,
  DocH1,
  DocH2,
  DocLi,
  DocP,
  DocUl,
} from '@/components/docs/MDXComponents';

export default function UploadingPage() {
  return (
    <div>
      <DocH1>Uploading Excel Files</DocH1>
      <DocP>
        SheetMind accepts Excel files in <DocCode>.xlsx</DocCode> and <DocCode>.xls</DocCode>{' '}
        formats. Files can be uploaded via drag-and-drop or the file browser.
      </DocP>
      <DocH2>Drag and Drop</DocH2>
      <DocP>
        Drag one or more Excel files from your file manager directly onto the upload zone. The zone
        highlights with a violet border when a valid file is hovering over it. Release to start the
        upload.
      </DocP>
      <ImagePlaceholder label="Drag and Drop Upload in Progress" />
      <DocH2>Browse Upload</DocH2>
      <DocP>
        Click the Browse button to open a system file dialog. Select one or more files and click
        Open. The upload begins immediately.
      </DocP>
      <DocH2>Upload Progress</DocH2>
      <DocP>
        Each file shows a progress bar during upload and import. The progress indicator shows two
        phases: file transfer and database import. Large files with many sheets may take a few
        seconds to import.
      </DocP>
      <DocH2>Error Handling</DocH2>
      <DocUl>
        <DocLi>
          <strong>Invalid format</strong> — Only .xlsx and .xls files are accepted. Other formats
          show an error toast.
        </DocLi>
        <DocLi>
          <strong>Corrupted file</strong> — If the file cannot be parsed, an error message explains
          the issue.
        </DocLi>
        <DocLi>
          <strong>Duplicate file</strong> — Uploading a file with the same name as an existing file
          replaces the previous version.
        </DocLi>
      </DocUl>
      <Callout type="info">
        SheetMind creates a copy of your file in the local database. The original file on your disk
        is never modified or locked.
      </Callout>
    </div>
  );
}
