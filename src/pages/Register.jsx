import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendPhoneOTP } from '../services/userService';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Phone } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+1',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[1-9][\d]{6,14}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (7-15 digits)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const fullPhoneNumber = formData.countryCode + formData.phone;
      const result = await register(formData.email, formData.password, formData.name, fullPhoneNumber);
      
      if (result.success) {
        if (result.emailVerificationSent) {
          // Send SMS OTP after successful registration
          try {
            const otpResult = await sendPhoneOTP(fullPhoneNumber);
            if (otpResult.success) {
              setErrors({ 
                success: 'Registration successful! Please check your email and phone for verification codes.' 
              });
              // Navigate to phone verification page
              setTimeout(() => {
                navigate(`/verify-phone?userId=${otpResult.userId}&phone=${encodeURIComponent(fullPhoneNumber)}`, { replace: true });
              }, 2000);
            } else {
              setErrors({ 
                success: 'Registration successful! Please check your email to verify your account. Phone verification will be available after email verification.' 
              });
              setTimeout(() => {
                navigate('/login', { replace: true });
              }, 3000);
            }
          } catch (otpError) {
            console.error('SMS OTP error:', otpError);
            setErrors({ 
              success: 'Registration successful! Please check your email to verify your account. Phone verification will be available after email verification.' 
            });
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 3000);
          }
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^\w\s]/.test(password)) strength++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300'
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Create your account</h2>
          <p className="text-base text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-500 underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          <form className="form-mobile" onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-base text-red-800 font-medium">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {errors.success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-base text-green-800 font-medium">{errors.success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input pl-10 ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 flex">
                {/* Country Code Selector */}
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className={`w-auto min-w-0 max-w-[120px] rounded-l-md border border-r-0 border-gray-300 bg-white px-2 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                    errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                >
                  <option value="+93">🇦🇫 Afghanistan +93</option>
                  <option value="+355">🇦🇱 Albania +355</option>
                  <option value="+213">🇩🇿 Algeria +213</option>
                  <option value="+1684">🇦🇸 American Samoa +1684</option>
                  <option value="+376">🇦🇩 Andorra +376</option>
                  <option value="+244">🇦🇴 Angola +244</option>
                  <option value="+1264">🇦🇮 Anguilla +1264</option>
                  <option value="+672">🇦🇶 Antarctica +672</option>
                  <option value="+1268">🇦🇬 Antigua and Barbuda +1268</option>
                  <option value="+54">🇦🇷 Argentina +54</option>
                  <option value="+374">🇦🇲 Armenia +374</option>
                  <option value="+297">🇦🇼 Aruba +297</option>
                  <option value="+61">🇦🇺 Australia +61</option>
                  <option value="+43">🇦🇹 Austria +43</option>
                  <option value="+994">🇦🇿 Azerbaijan +994</option>
                  <option value="+1242">🇧🇸 Bahamas +1242</option>
                  <option value="+973">🇧🇭 Bahrain +973</option>
                  <option value="+880">🇧🇩 Bangladesh +880</option>
                  <option value="+1246">🇧🇧 Barbados +1246</option>
                  <option value="+375">🇧🇾 Belarus +375</option>
                  <option value="+32">🇧🇪 Belgium +32</option>
                  <option value="+501">🇧🇿 Belize +501</option>
                  <option value="+229">🇧🇯 Benin +229</option>
                  <option value="+1441">🇧🇲 Bermuda +1441</option>
                  <option value="+975">🇧🇹 Bhutan +975</option>
                  <option value="+591">🇧🇴 Bolivia +591</option>
                  <option value="+387">🇧🇦 Bosnia and Herzegovina +387</option>
                  <option value="+267">🇧🇼 Botswana +267</option>
                  <option value="+55">🇧🇷 Brazil +55</option>
                  <option value="+246">🇮🇴 British Indian Ocean Territory +246</option>
                  <option value="+673">🇧🇳 Brunei +673</option>
                  <option value="+359">🇧🇬 Bulgaria +359</option>
                  <option value="+226">🇧🇫 Burkina Faso +226</option>
                  <option value="+257">🇧🇮 Burundi +257</option>
                  <option value="+855">🇰🇭 Cambodia +855</option>
                  <option value="+237">🇨🇲 Cameroon +237</option>
                  <option value="+1">🇨🇦 Canada +1</option>
                  <option value="+238">🇨🇻 Cape Verde +238</option>
                  <option value="+1345">🇰🇾 Cayman Islands +1345</option>
                  <option value="+236">🇨🇫 Central African Republic +236</option>
                  <option value="+235">🇹🇩 Chad +235</option>
                  <option value="+56">🇨🇱 Chile +56</option>
                  <option value="+86">🇨🇳 China +86</option>
                  <option value="+61">🇨🇽 Christmas Island +61</option>
                  <option value="+61">🇨🇨 Cocos Islands +61</option>
                  <option value="+57">🇨🇴 Colombia +57</option>
                  <option value="+269">🇰🇲 Comoros +269</option>
                  <option value="+242">🇨🇬 Congo +242</option>
                  <option value="+243">🇨🇩 Congo (DRC) +243</option>
                  <option value="+682">🇨🇰 Cook Islands +682</option>
                  <option value="+506">🇨🇷 Costa Rica +506</option>
                  <option value="+225">🇨🇮 Côte d'Ivoire +225</option>
                  <option value="+385">🇭🇷 Croatia +385</option>
                  <option value="+53">🇨🇺 Cuba +53</option>
                  <option value="+599">🇨🇼 Curaçao +599</option>
                  <option value="+357">🇨🇾 Cyprus +357</option>
                  <option value="+420">🇨🇿 Czech Republic +420</option>
                  <option value="+45">🇩🇰 Denmark +45</option>
                  <option value="+253">🇩🇯 Djibouti +253</option>
                  <option value="+1767">🇩🇲 Dominica +1767</option>
                  <option value="+1809">🇩🇴 Dominican Republic +1809</option>
                  <option value="+593">🇪🇨 Ecuador +593</option>
                  <option value="+20">🇪🇬 Egypt +20</option>
                  <option value="+503">🇸🇻 El Salvador +503</option>
                  <option value="+240">🇬🇶 Equatorial Guinea +240</option>
                  <option value="+291">🇪🇷 Eritrea +291</option>
                  <option value="+372">🇪🇪 Estonia +372</option>
                  <option value="+268">🇸🇿 Eswatini +268</option>
                  <option value="+251">🇪🇹 Ethiopia +251</option>
                  <option value="+500">🇫🇰 Falkland Islands +500</option>
                  <option value="+298">🇫🇴 Faroe Islands +298</option>
                  <option value="+679">🇫🇯 Fiji +679</option>
                  <option value="+358">🇫🇮 Finland +358</option>
                  <option value="+33">🇫🇷 France +33</option>
                  <option value="+594">🇬🇫 French Guiana +594</option>
                  <option value="+689">🇵🇫 French Polynesia +689</option>
                  <option value="+241">🇬🇦 Gabon +241</option>
                  <option value="+220">🇬🇲 Gambia +220</option>
                  <option value="+995">🇬🇪 Georgia +995</option>
                  <option value="+49">🇩🇪 Germany +49</option>
                  <option value="+233">🇬🇭 Ghana +233</option>
                  <option value="+350">🇬🇮 Gibraltar +350</option>
                  <option value="+30">🇬🇷 Greece +30</option>
                  <option value="+299">🇬🇱 Greenland +299</option>
                  <option value="+1473">🇬🇩 Grenada +1473</option>
                  <option value="+590">🇬🇵 Guadeloupe +590</option>
                  <option value="+1671">🇬🇺 Guam +1671</option>
                  <option value="+502">🇬🇹 Guatemala +502</option>
                  <option value="+44">🇬🇬 Guernsey +44</option>
                  <option value="+224">🇬🇳 Guinea +224</option>
                  <option value="+245">🇬🇼 Guinea-Bissau +245</option>
                  <option value="+592">🇬🇾 Guyana +592</option>
                  <option value="+509">🇭🇹 Haiti +509</option>
                  <option value="+504">🇭🇳 Honduras +504</option>
                  <option value="+852">🇭🇰 Hong Kong +852</option>
                  <option value="+36">🇭🇺 Hungary +36</option>
                  <option value="+354">🇮🇸 Iceland +354</option>
                  <option value="+91">🇮🇳 India +91</option>
                  <option value="+62">🇮🇩 Indonesia +62</option>
                  <option value="+98">🇮🇷 Iran +98</option>
                  <option value="+964">🇮🇶 Iraq +964</option>
                  <option value="+353">🇮🇪 Ireland +353</option>
                  <option value="+44">🇮🇲 Isle of Man +44</option>
                  <option value="+972">🇮🇱 Israel +972</option>
                  <option value="+39">🇮🇹 Italy +39</option>
                  <option value="+1876">🇯🇲 Jamaica +1876</option>
                  <option value="+81">🇯🇵 Japan +81</option>
                  <option value="+44">🇯🇪 Jersey +44</option>
                  <option value="+962">🇯🇴 Jordan +962</option>
                  <option value="+7">🇰🇿 Kazakhstan +7</option>
                  <option value="+254">🇰🇪 Kenya +254</option>
                  <option value="+686">🇰🇮 Kiribati +686</option>
                  <option value="+850">🇰🇵 North Korea +850</option>
                  <option value="+82">🇰🇷 South Korea +82</option>
                  <option value="+965">🇰🇼 Kuwait +965</option>
                  <option value="+996">🇰🇬 Kyrgyzstan +996</option>
                  <option value="+856">🇱🇦 Laos +856</option>
                  <option value="+371">🇱🇻 Latvia +371</option>
                  <option value="+961">🇱🇧 Lebanon +961</option>
                  <option value="+266">🇱🇸 Lesotho +266</option>
                  <option value="+231">🇱🇷 Liberia +231</option>
                  <option value="+218">🇱🇾 Libya +218</option>
                  <option value="+423">🇱🇮 Liechtenstein +423</option>
                  <option value="+370">🇱🇹 Lithuania +370</option>
                  <option value="+352">🇱🇺 Luxembourg +352</option>
                  <option value="+853">🇲🇴 Macao +853</option>
                  <option value="+389">🇲🇰 North Macedonia +389</option>
                  <option value="+261">🇲🇬 Madagascar +261</option>
                  <option value="+265">🇲🇼 Malawi +265</option>
                  <option value="+60">🇲🇾 Malaysia +60</option>
                  <option value="+960">🇲🇻 Maldives +960</option>
                  <option value="+223">🇲🇱 Mali +223</option>
                  <option value="+356">🇲🇹 Malta +356</option>
                  <option value="+692">🇲🇭 Marshall Islands +692</option>
                  <option value="+596">🇲🇶 Martinique +596</option>
                  <option value="+222">🇲🇷 Mauritania +222</option>
                  <option value="+230">🇲🇺 Mauritius +230</option>
                  <option value="+262">🇾🇹 Mayotte +262</option>
                  <option value="+52">🇲🇽 Mexico +52</option>
                  <option value="+691">🇫🇲 Micronesia +691</option>
                  <option value="+373">🇲🇩 Moldova +373</option>
                  <option value="+377">🇲🇨 Monaco +377</option>
                  <option value="+976">🇲🇳 Mongolia +976</option>
                  <option value="+382">🇲🇪 Montenegro +382</option>
                  <option value="+1664">🇲🇸 Montserrat +1664</option>
                  <option value="+212">🇲🇦 Morocco +212</option>
                  <option value="+258">🇲🇿 Mozambique +258</option>
                  <option value="+95">🇲🇲 Myanmar +95</option>
                  <option value="+264">🇳🇦 Namibia +264</option>
                  <option value="+674">🇳🇷 Nauru +674</option>
                  <option value="+977">🇳🇵 Nepal +977</option>
                  <option value="+31">🇳🇱 Netherlands +31</option>
                  <option value="+687">🇳🇨 New Caledonia +687</option>
                  <option value="+64">🇳🇿 New Zealand +64</option>
                  <option value="+505">🇳🇮 Nicaragua +505</option>
                  <option value="+227">🇳🇪 Niger +227</option>
                  <option value="+234">🇳🇬 Nigeria +234</option>
                  <option value="+683">🇳🇺 Niue +683</option>
                  <option value="+672">🇳🇫 Norfolk Island +672</option>
                  <option value="+1670">🇲🇵 Northern Mariana Islands +1670</option>
                  <option value="+47">🇳🇴 Norway +47</option>
                  <option value="+968">🇴🇲 Oman +968</option>
                  <option value="+92">🇵🇰 Pakistan +92</option>
                  <option value="+680">🇵🇼 Palau +680</option>
                  <option value="+970">🇵🇸 Palestine +970</option>
                  <option value="+507">🇵🇦 Panama +507</option>
                  <option value="+675">🇵🇬 Papua New Guinea +675</option>
                  <option value="+595">🇵🇾 Paraguay +595</option>
                  <option value="+51">🇵🇪 Peru +51</option>
                  <option value="+63">🇵🇭 Philippines +63</option>
                  <option value="+64">🇵🇳 Pitcairn +64</option>
                  <option value="+48">🇵🇱 Poland +48</option>
                  <option value="+351">🇵🇹 Portugal +351</option>
                  <option value="+1787">🇵🇷 Puerto Rico +1787</option>
                  <option value="+974">🇶🇦 Qatar +974</option>
                  <option value="+262">🇷🇪 Réunion +262</option>
                  <option value="+40">🇷🇴 Romania +40</option>
                  <option value="+7">🇷🇺 Russia +7</option>
                  <option value="+250">🇷🇼 Rwanda +250</option>
                  <option value="+590">🇧🇱 Saint Barthélemy +590</option>
                  <option value="+290">🇸🇭 Saint Helena +290</option>
                  <option value="+1869">🇰🇳 Saint Kitts and Nevis +1869</option>
                  <option value="+1758">🇱🇨 Saint Lucia +1758</option>
                  <option value="+590">🇲🇫 Saint Martin +590</option>
                  <option value="+508">🇵🇲 Saint Pierre and Miquelon +508</option>
                  <option value="+1784">🇻🇨 Saint Vincent and the Grenadines +1784</option>
                  <option value="+685">🇼🇸 Samoa +685</option>
                  <option value="+378">🇸🇲 San Marino +378</option>
                  <option value="+239">🇸🇹 São Tomé and Príncipe +239</option>
                  <option value="+966">🇸🇦 Saudi Arabia +966</option>
                  <option value="+221">🇸🇳 Senegal +221</option>
                  <option value="+381">🇷🇸 Serbia +381</option>
                  <option value="+248">🇸🇨 Seychelles +248</option>
                  <option value="+232">🇸🇱 Sierra Leone +232</option>
                  <option value="+65">🇸🇬 Singapore +65</option>
                  <option value="+1721">🇸🇽 Sint Maarten +1721</option>
                  <option value="+421">🇸🇰 Slovakia +421</option>
                  <option value="+386">🇸🇮 Slovenia +386</option>
                  <option value="+677">🇸🇧 Solomon Islands +677</option>
                  <option value="+252">🇸🇴 Somalia +252</option>
                  <option value="+27">🇿🇦 South Africa +27</option>
                  <option value="+500">🇬🇸 South Georgia and the South Sandwich Islands +500</option>
                  <option value="+211">🇸🇸 South Sudan +211</option>
                  <option value="+34">🇪🇸 Spain +34</option>
                  <option value="+94">🇱🇰 Sri Lanka +94</option>
                  <option value="+249">🇸🇩 Sudan +249</option>
                  <option value="+597">🇸🇷 Suriname +597</option>
                  <option value="+47">🇸🇯 Svalbard and Jan Mayen +47</option>
                  <option value="+46">🇸🇪 Sweden +46</option>
                  <option value="+41">🇨🇭 Switzerland +41</option>
                  <option value="+963">🇸🇾 Syria +963</option>
                  <option value="+886">🇹🇼 Taiwan +886</option>
                  <option value="+992">🇹🇯 Tajikistan +992</option>
                  <option value="+255">🇹🇿 Tanzania +255</option>
                  <option value="+66">🇹🇭 Thailand +66</option>
                  <option value="+670">🇹🇱 Timor-Leste +670</option>
                  <option value="+228">🇹🇬 Togo +228</option>
                  <option value="+690">🇹🇰 Tokelau +690</option>
                  <option value="+676">🇹🇴 Tonga +676</option>
                  <option value="+1868">🇹🇹 Trinidad and Tobago +1868</option>
                  <option value="+216">🇹🇳 Tunisia +216</option>
                  <option value="+90">🇹🇷 Turkey +90</option>
                  <option value="+993">🇹🇲 Turkmenistan +993</option>
                  <option value="+1649">🇹🇨 Turks and Caicos Islands +1649</option>
                  <option value="+688">🇹🇻 Tuvalu +688</option>
                  <option value="+256">🇺🇬 Uganda +256</option>
                  <option value="+380">🇺🇦 Ukraine +380</option>
                  <option value="+971">🇦🇪 United Arab Emirates +971</option>
                  <option value="+44">🇬🇧 United Kingdom +44</option>
                  <option value="+1">🇺🇸 United States +1</option>
                  <option value="+598">🇺🇾 Uruguay +598</option>
                  <option value="+998">🇺🇿 Uzbekistan +998</option>
                  <option value="+678">🇻🇺 Vanuatu +678</option>
                  <option value="+379">🇻🇦 Vatican City +379</option>
                  <option value="+58">🇻🇪 Venezuela +58</option>
                  <option value="+84">🇻🇳 Vietnam +84</option>
                  <option value="+1284">🇻🇬 British Virgin Islands +1284</option>
                  <option value="+1340">🇻🇮 U.S. Virgin Islands +1340</option>
                  <option value="+681">🇼🇫 Wallis and Futuna +681</option>
                  <option value="+212">🇪🇭 Western Sahara +212</option>
                  <option value="+967">🇾🇪 Yemen +967</option>
                  <option value="+260">🇿🇲 Zambia +260</option>
                  <option value="+263">🇿🇼 Zimbabwe +263</option>
                </select>
                
                {/* Phone Input */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 text-base ${
                      errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.color
                        }`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="mt-1 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Passwords match</span>
                </div>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                } transition-colors duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;