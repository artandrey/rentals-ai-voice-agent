import os
import boto3
import unittest
from uuid import uuid4
from pathlib import Path


class TestS3Upload(unittest.TestCase):
    def setUp(self):
        """Set up the S3 client to connect to localstack"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id='test',
            aws_secret_access_key='test',
            endpoint_url='http://localhost:4566',  # localstack endpoint
            region_name='us-east-1'
        )
        
        # Bucket name for testing
        self.bucket_name = 'test-bucket'
        
        # Create the bucket if it doesn't exist
        try:
            self.s3_client.create_bucket(Bucket=self.bucket_name)
            print(f"Created test bucket: {self.bucket_name}")
        except self.s3_client.exceptions.BucketAlreadyExists:
            print(f"Using existing bucket: {self.bucket_name}")
        except Exception as e:
            print(f"Error creating bucket: {e}")
    
    def test_upload_file(self):
        """Test uploading a file to S3"""
        # Create a temporary test file
        test_file_path = 'test_upload.txt'
        test_content = 'This is a test file for S3 upload'
        
        with open(test_file_path, 'w') as f:
            f.write(test_content)
        
        try:
            # Generate a unique object key
            object_key = f'test_uploads/{uuid4()}.txt'
            
            # Upload the file
            self.s3_client.upload_file(
                Filename=test_file_path,
                Bucket=self.bucket_name,
                Key=object_key
            )
            
            # Verify the file was uploaded
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='test_uploads/'
            )
            
            # Check if the file exists in the bucket
            self.assertIn('Contents', response)
            uploaded_files = [obj['Key'] for obj in response['Contents']]
            self.assertIn(object_key, uploaded_files)
            
            # Download the file and verify contents
            download_path = 'test_download.txt'
            self.s3_client.download_file(
                Bucket=self.bucket_name,
                Key=object_key,
                Filename=download_path
            )
            
            with open(download_path, 'r') as f:
                downloaded_content = f.read()
            
            # Verify the content matches
            self.assertEqual(test_content, downloaded_content)
            
            print(f"File successfully uploaded and verified: {object_key}")
            
        finally:
            # Clean up test files
            if os.path.exists(test_file_path):
                os.remove(test_file_path)
            if os.path.exists(download_path):
                os.remove(download_path)

    def test_list_buckets(self):
        """Test listing S3 buckets"""
        response = self.s3_client.list_buckets()
        buckets = [bucket['Name'] for bucket in response['Buckets']]
        self.assertIn(self.bucket_name, buckets)
        print(f"Available buckets: {buckets}")

    def tearDown(self):
        """Clean up test resources"""
        # Delete all objects in the test bucket
        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
            print(response)
            # if 'Contents' in response:
            #     for obj in response['Contents']:
            #         self.s3_client.delete_object(
            #             Bucket=self.bucket_name,
            #             Key=obj['Key']
            #         )
            #     print(f"Cleaned up all objects in the bucket: {self.bucket_name}")
        except Exception as e:
            print(f"Error during cleanup: {e}")


if __name__ == '__main__':
    unittest.main() 