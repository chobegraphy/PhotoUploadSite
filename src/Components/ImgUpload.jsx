import axios from "axios";
import ExifReader from "exifreader"; // Import ExifReader
import { extractColors } from "extract-colors";
import { useEffect, useState } from "react";
const PhotoUploader = () => {
  const [photo, setPhoto] = useState(null);
  const [filename, setFilename] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [author, setAuthor] = useState("Chobegraphy"); // Replace with actual author
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [copyright, setCopyright] = useState("");
  const [Name, setName] = useState("");
  const [collections, setCollections] = useState([]);
  const [downloadable, setDownloadable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repoSize, setRepoSize] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showUploadOption, setShowUploadOption] = useState(false);
  const [encodedPhoto, setEncodedPhoto] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [colors, setColors] = useState(null);
  const [exifData, setExifData] = useState({
    aperture: "",
    exposureTime: "",
    flash: "",
    iso: "",
    model: "",
    software: "",
    datetimeOriginal: "",
    focalLength: "",
    creatorTool: "",
    subjectDistance: "",
    imageHeight: "",
    imageWidth: "",
  });
  const suggestions = [
    "Featured",
    "Nature",
    "Cat",
    "Bird",
    "Butterfly",
    "Car",
    "Flower",
    "Anime",
    "Artistic",
    "Ai",
    "Urban",
    "Marvel",
    "Dc",
    "Minimal",
    "Texture",
    "Vector",
    "Sea & Lakes",
    "Sky",
    "Forest",
    "Fruits",
  ];
  useEffect(() => {
    axios
      .get("https://chobegraphy-server.vercel.app/api/repo-size")
      .then((res) => {
        setRepoSize(JSON.parse(res.data.sizeInGB));
      });
  }, []);
  // Convert file to Base64 and extract dimensions
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };
  const convertToBase64Thumbnail = (file, maxWidth = 20) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Calculate new dimensions
          const scaleFactor = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleFactor;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]); // Convert to Base64 (JPEG, 70% quality)
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  // Extract EXIF data using ExifReader
  const extractExifData = (file) => {
    // Extract EXIF data
    const reader = new FileReader();
    reader.onload = (e) => {
      const exif = ExifReader.load(e.target.result);
      const extractedExifData = {
        aperture: exif.ApertureValue?.description || "",
        exposureTime: exif.ExposureTime?.description || "",
        flash: exif.Flash?.description || "",
        iso: exif.ISOSpeedRatings?.description || "",
        model: exif.Model?.description || "",
        software: exif.Software?.description || "",
        datetimeOriginal: exif.DateTimeOriginal?.description || "",
        focalLength: exif.FocalLength?.description || "",
        creatorTool: exif.CreatorTool?.description || "",
        subjectDistance: exif.SubjectDistance?.description || "",
      };

      // Save EXIF data to state
      setExifData(extractedExifData);
    };
    reader.readAsArrayBuffer(file);
  };
  const getDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          // Set dimensions once the image is loaded
          resolve({ width: img.width, height: img.height });
          setDimensions(`${img.width} x ${img.height}`);
        };
        img.onerror = (error) => reject(error);
        img.src = reader.result;
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file); // Read file as a data URL to load the image
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      setFilename(file.name); // Set the file name
      const base64 = await convertToBase64(file); // Convert file to base64
      setPhoto(base64); // Store the base64 string in state
      extractColors(`data:image/jpeg;base64,${base64}`).then((col) => {
        console.log(col);
        setColors(col);
      });
      console.log(colors);
      const fileSizeInBytes = file.size; // Size in bytes
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      setFileSize(fileSizeInMB);
      const thumbnailBase64 = await convertToBase64Thumbnail(file);
      setEncodedPhoto(thumbnailBase64);
      getDimensions(file);
      setImageUrl2(`data:image/jpeg;base64,${thumbnailBase64}`);
      extractExifData(file);
    }
  };

  const handleCollectionClick = (collection) => {
    if (!collections.includes(collection)) {
      setCollections([...collections, collection]);
    }
  };

  const handleCollectionRemove = (collection) => {
    setCollections(collections.filter((item) => item !== collection));
  };

  const handleSubmit = async (event) => {
    setLoading(true);
    event.preventDefault();

    if (!photo || !filename) {
      setUploadStatus("Please select a file before uploading.");
      setLoading(false);
      return;
    }

    try {
      const uploadResponse = await axios.post(
        "https://chobegraphy-server.vercel.app/api/upload",
        {
          photo,
          filename,
        }
      );
      const formData1 = new FormData();
      formData1.append("image", encodedPhoto);
      const imgbbResponse1 = await axios.post(
        "https://api.imgbb.com/1/upload?key=eada499cd6dc5e09c832c88531a41acb",
        formData1
      );
      const imgbbData1 = imgbbResponse1.data.data;
      if (imgbbData1.display_url) {
        const formData = new FormData();
        formData.append("image", photo);
        const imgbbResponse = await axios.post(
          "https://api.imgbb.com/1/upload?key=eada499cd6dc5e09c832c88531a41acb",
          formData
        );
        const imgbbData = imgbbResponse.data.data;
        const thumbnail = imgbbData.medium.url;
        console.log(uploadResponse.data.imageUrl);
        const uploadedUrl = uploadResponse.data.imageUrl;

        const metadata = {
          name: Name,
          author: author, // Replace with actual author
          url: uploadedUrl,
          dimensions,
          collections: collections.join(", "),
          copyright,
          downloadable,
          thumbnail,
          encodedUrl: imgbbData1.display_url,
          exifData,
          fileSize,
          colors,
        };

        // Send metadata to a secondary API
        const metadataResponse = await axios.post(
          "https://chobegraphy-server.vercel.app/api/add-data",
          metadata
        );
        console.log(metadataResponse.data);
        if (metadataResponse.data.message) {
          setUploadStatus("Success! File uploaded ");
          setImageUrl(thumbnail);
        } else {
          setUploadStatus("File upload failed.");
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("An error occurred while uploading.");
      setLoading(false);
    }
  };
  console.log(exifData);
  return (
    <div className="flex flex-col items-center min-h-screen mt-10 justify-center  my-5">
      {!showUploadOption && (
        <div
          id="passcheck"
          className="flex flex-col items-center justify-center"
        >
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
            className="file-input file-input-bordered text-green-500 my-3 w-full px-3 "
          />
          <input
            type="text"
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            className="file-input file-input-bordered text-green-500  w-full px-3 "
          />
          <button
            onClick={() => {
              if (
                email === "Chobegraphy@gmail.com" &&
                password === "Chobegraphy1011"
              ) {
                setShowUploadOption(true);
              } else {
                setShowUploadOption(false);
                window.location.href =
                  "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
              }
            }}
            type="button"
            className="btn btn-md my-3 bg-green-500 text-white py-2 px-10 btn-outline"
          >
            login
          </button>
        </div>
      )}
      {showUploadOption && (
        <>
          <div>
            {colors !== null &&
              colors.map((color) => (
                <p
                  style={{ backgroundColor: color?.hex }}
                  key={color}
                  className={`text-3xl  flex items-start w-fit px-3 max-md:mr-auto py-2 rounded my-3 text-white`}
                >
                  {color?.hex}
                </p>
              ))}
          </div>
          {fileSize}mb
          {exifData && (
            <div>
              <h3>EXIF Data:</h3>
              <pre>{JSON.stringify(exifData, null, 2)}</pre>
              <pre>{JSON.stringify(exifData?.Image_Height, null, 2)}</pre>
            </div>
          )}
          {imageUrl2 && (
            <div>
              <img
                src={imageUrl2} // Display the thumbnail here
                alt="Thumbnail"
                className="max-w-2xl rounded-lg max-md:w-[200px]"
              />
            </div>
          )}{" "}
          <h2 className="font-serif text-3xl text-green-500">
            Upload Photo to Chobegraphy Storage
          </h2>
          <p className="text-xl bg-green-500 flex items-start w-fit px-3 max-md:mr-auto py-2 rounded my-3 text-white">
            Storage Used: {repoSize}/5 GB
          </p>
          <form className="flex flex-col items-center" onSubmit={handleSubmit}>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input file-input-bordered text-green-500 my-3 w-full max-w-xs"
              />
            </div>
            <p className="text-xl text-green-500 flex items-start w-full">
              Img Name
            </p>
            <input
              type="text"
              placeholder="Add Img Name"
              value={Name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered my-3 w-full max-w-xs"
            />
            <p className="text-xl text-green-500 flex items-start w-full">
              Copyright Link
            </p>
            <input
              type="text"
              placeholder="Add Copyright Link"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              className="input input-bordered my-3 w-full max-w-xs"
            />
            <p className="text-xl text-green-500 flex items-start w-full">
              Author Name
            </p>
            <input
              type="text"
              placeholder="Add Author Name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input input-bordered my-3 w-full max-w-xs"
            />
            <p className="text-xl bg-green-500 text-white rounded-md px-2 flex items-start w-fit me-auto">
              Dimensions: {dimensions} px
            </p>
            <div className="my-3 w-full max-w-xs">
              {collections.map((item) => (
                <span
                  key={item}
                  className="badge badge-outline badge-success mx-1 cursor-pointer"
                  onClick={() => handleCollectionRemove(item)}
                >
                  {item} ✕
                </span>
              ))}
            </div>
            <div className=" w-full max-w-xs">
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleCollectionClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-3 w-full max-w-xs flex items-center gap-2">
              <label className="label cursor-pointer">
                <span className="label-text">Downloadable</span>
                <input
                  type="checkbox"
                  checked={downloadable}
                  onChange={(e) => setDownloadable(e.target.checked)}
                  className="checkbox"
                />
              </label>
            </div>

            {repoSize < 4.7 ? (
              <button
                type="submit"
                className="btn bg-green-600 px-4 outline-none text-white hover:bg-white hover:text-green-500"
              >
                {loading ? (
                  <span className="loading loading-dots loading-md"></span>
                ) : (
                  "Upload Img"
                )}
              </button>
            ) : (
              <p className="text-sm text-red-500 flex items-start w-fit px-3 max-md:mr-auto py-2  my-3">
                Storage Almost Full
                <a
                  href="https://wa.me/+8801980389400?text=Please%20change%20the%20chobegraphy%20photo%20upload%20storage%20repo,%20current%20size%20is%20almost%20full"
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  contact
                </a>
                dev to change storage
              </p>
            )}
          </form>
          {uploadStatus && (
            <p
              className="mb-2"
              style={{
                marginTop: "20px",
                color: uploadStatus.includes("Success") ? "green" : "red",
              }}
            >
              {uploadStatus}
            </p>
          )}
          {imageUrl && (
            <div>
              <img
                src={imageUrl}
                alt="Uploaded"
                className="max-w-2xl rounded-lg max-md:w-[200px]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhotoUploader;
