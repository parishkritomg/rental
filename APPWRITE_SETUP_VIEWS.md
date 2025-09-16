# Adding Views Field to Appwrite Properties Collection

The view tracking feature requires a `views` field in the properties collection. Follow these steps to add it:

## Steps to Add Views Field in Appwrite Console:

1. **Open Appwrite Console**
   - Go to https://nyc.cloud.appwrite.io/console
   - Login to your account
   - Select your project: "Rental Apps"

2. **Navigate to Database**
   - Click on "Databases" in the left sidebar
   - Select your database: `68c4288d002de0868cf0`

3. **Open Properties Collection**
   - Click on the "properties" collection

4. **Add Views Attribute**
   - Click on "Attributes" tab
   - Click "+ Create Attribute"
   - Select "Integer" type
   - Set the following:
     - **Key**: `views`
     - **Size**: `32-bit` (default)
     - **Required**: `No` (unchecked)
     - **Array**: `No` (unchecked)
     - **Default Value**: `0`
   - Click "Create"

5. **Wait for Deployment**
   - The attribute creation may take a few moments
   - Wait until the status shows as "Available"

## Verification

After adding the field:
1. Refresh your application
2. Visit any property detail page
3. Check the browser console for any errors
4. Go to the Dashboard to see if view counts appear

## Alternative: Bulk Update Existing Properties

If you have existing properties without the views field, you may need to:
1. Go to the "Documents" tab in the properties collection
2. Edit each property document
3. Add a `views` field with value `0`

Or use the Appwrite API to bulk update (requires server-side script).