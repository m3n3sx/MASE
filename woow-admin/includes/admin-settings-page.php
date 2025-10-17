<?php
/**
 * Admin Settings Page Template
 *
 * Renders the settings form with color pickers and input fields.
 *
 * @package ModernAdminStyler
 * @since 1.0.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
?>

<div class="wrap">
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
	
	<form id="mase-settings-form" method="post">
		<?php wp_nonce_field( 'mase_save_settings', 'mase_nonce' ); ?>
		
		<!-- Palette Presets Section -->
		<h2><?php esc_html_e( 'Quick Style Presets', 'modern-admin-styler' ); ?></h2>
		<div class="palette-grid">
			<?php
			$settings_obj = new MASE_Settings();
			$palettes     = $settings_obj->get_default_palettes();
			foreach ( $palettes as $id => $palette ) :
				?>
				<button type="button" class="palette-preset button" data-palette="<?php echo esc_attr( $id ); ?>">
					<span class="palette-preview" style="background: <?php echo esc_attr( $palette['admin_bar']['bg_color'] ); ?>"></span>
					<span class="palette-name"><?php echo esc_html( $palette['name'] ); ?></span>
				</button>
			<?php endforeach; ?>
		</div>
		<p class="description"><?php esc_html_e( 'Click a preset to quickly apply a professional color scheme', 'modern-admin-styler' ); ?></p>
		
		<!-- Admin Bar Settings -->
		<h2><?php esc_html_e( 'Admin Bar Settings', 'modern-admin-styler' ); ?></h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="admin-bar-bg-color">
							<?php esc_html_e( 'Background Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-bar-bg-color"
							name="admin_bar[bg_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_bar']['bg_color'] ); ?>"
							aria-describedby="admin-bar-bg-color-desc"
						/>
						<p class="description" id="admin-bar-bg-color-desc">
							<?php esc_html_e( 'Choose the background color for the WordPress admin bar.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-text-color">
							<?php esc_html_e( 'Text Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-bar-text-color"
							name="admin_bar[text_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_bar']['text_color'] ); ?>"
							aria-describedby="admin-bar-text-color-desc"
						/>
						<p class="description" id="admin-bar-text-color-desc">
							<?php esc_html_e( 'Choose the text color for the WordPress admin bar.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-height">
							<?php esc_html_e( 'Height (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="admin-bar-height"
							name="admin_bar[height]" 
							class="small-text mase-input"
							value="<?php echo esc_attr( $settings['admin_bar']['height'] ); ?>"
							min="0"
							max="500"
							aria-describedby="admin-bar-height-desc"
						/>
						<p class="description" id="admin-bar-height-desc">
							<?php esc_html_e( 'Set the height of the admin bar in pixels (0-500).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Admin Menu Settings -->
		<h2><?php esc_html_e( 'Admin Menu Settings', 'modern-admin-styler' ); ?></h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="admin-menu-bg-color">
							<?php esc_html_e( 'Background Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-menu-bg-color"
							name="admin_menu[bg_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_menu']['bg_color'] ); ?>"
							aria-describedby="admin-menu-bg-color-desc"
						/>
						<p class="description" id="admin-menu-bg-color-desc">
							<?php esc_html_e( 'Choose the background color for the admin menu.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-menu-text-color">
							<?php esc_html_e( 'Text Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-menu-text-color"
							name="admin_menu[text_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_menu']['text_color'] ); ?>"
							aria-describedby="admin-menu-text-color-desc"
						/>
						<p class="description" id="admin-menu-text-color-desc">
							<?php esc_html_e( 'Choose the text color for admin menu items.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-menu-hover-bg-color">
							<?php esc_html_e( 'Hover Background Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-menu-hover-bg-color"
							name="admin_menu[hover_bg_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_menu']['hover_bg_color'] ); ?>"
							aria-describedby="admin-menu-hover-bg-color-desc"
						/>
						<p class="description" id="admin-menu-hover-bg-color-desc">
							<?php esc_html_e( 'Choose the background color when hovering over menu items.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-menu-hover-text-color">
							<?php esc_html_e( 'Hover Text Color', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="text" 
							id="admin-menu-hover-text-color"
							name="admin_menu[hover_text_color]" 
							class="mase-color-picker mase-input"
							value="<?php echo esc_attr( $settings['admin_menu']['hover_text_color'] ); ?>"
							aria-describedby="admin-menu-hover-text-color-desc"
						/>
						<p class="description" id="admin-menu-hover-text-color-desc">
							<?php esc_html_e( 'Choose the text color when hovering over menu items.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-menu-width">
							<?php esc_html_e( 'Width (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="admin-menu-width"
							name="admin_menu[width]" 
							class="small-text mase-input"
							value="<?php echo esc_attr( $settings['admin_menu']['width'] ); ?>"
							min="0"
							max="500"
							aria-describedby="admin-menu-width-desc"
						/>
						<p class="description" id="admin-menu-width-desc">
							<?php esc_html_e( 'Set the width of the admin menu in pixels (0-500).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Typography Settings -->
		<h2><?php esc_html_e( 'Typography Settings', 'modern-admin-styler' ); ?></h2>
		
		<!-- Admin Bar Typography -->
		<h3><?php esc_html_e( 'Admin Bar Typography', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="typography-admin-bar-font-size">
							<?php esc_html_e( 'Font Size (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="typography-admin-bar-font-size"
							name="typography[admin_bar][font_size]" 
							class="small-text mase-input mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_bar']['font_size'] ); ?>"
							min="10"
							max="32"
							step="1"
							aria-describedby="typography-admin-bar-font-size-desc"
						/>
						<p class="description" id="typography-admin-bar-font-size-desc">
							<?php esc_html_e( 'Set the font size for admin bar text (10-32 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-bar-font-weight">
							<?php esc_html_e( 'Font Weight', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-admin-bar-font-weight"
							name="typography[admin_bar][font_weight]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-admin-bar-font-weight-desc"
						>
							<option value="300" <?php selected( $settings['typography']['admin_bar']['font_weight'], 300 ); ?>>300 (Light)</option>
							<option value="400" <?php selected( $settings['typography']['admin_bar']['font_weight'], 400 ); ?>>400 (Normal)</option>
							<option value="500" <?php selected( $settings['typography']['admin_bar']['font_weight'], 500 ); ?>>500 (Medium)</option>
							<option value="600" <?php selected( $settings['typography']['admin_bar']['font_weight'], 600 ); ?>>600 (Semi-Bold)</option>
							<option value="700" <?php selected( $settings['typography']['admin_bar']['font_weight'], 700 ); ?>>700 (Bold)</option>
						</select>
						<p class="description" id="typography-admin-bar-font-weight-desc">
							<?php esc_html_e( 'Choose the font weight for admin bar text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-bar-line-height">
							<?php esc_html_e( 'Line Height', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-admin-bar-line-height"
							name="typography[admin_bar][line_height]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_bar']['line_height'] ); ?>"
							min="1.0"
							max="2.5"
							step="0.1"
							aria-describedby="typography-admin-bar-line-height-desc"
						/>
						<span class="mase-range-value" id="typography-admin-bar-line-height-value"><?php echo esc_html( $settings['typography']['admin_bar']['line_height'] ); ?></span>
						<p class="description" id="typography-admin-bar-line-height-desc">
							<?php esc_html_e( 'Adjust the line height for admin bar text (1.0-2.5).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-bar-letter-spacing">
							<?php esc_html_e( 'Letter Spacing (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-admin-bar-letter-spacing"
							name="typography[admin_bar][letter_spacing]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_bar']['letter_spacing'] ); ?>"
							min="-2"
							max="5"
							step="0.5"
							aria-describedby="typography-admin-bar-letter-spacing-desc"
						/>
						<span class="mase-range-value" id="typography-admin-bar-letter-spacing-value"><?php echo esc_html( $settings['typography']['admin_bar']['letter_spacing'] ); ?>px</span>
						<p class="description" id="typography-admin-bar-letter-spacing-desc">
							<?php esc_html_e( 'Adjust the letter spacing for admin bar text (-2 to 5 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-bar-text-transform">
							<?php esc_html_e( 'Text Transform', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-admin-bar-text-transform"
							name="typography[admin_bar][text_transform]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-admin-bar-text-transform-desc"
						>
							<option value="none" <?php selected( $settings['typography']['admin_bar']['text_transform'], 'none' ); ?>>None</option>
							<option value="uppercase" <?php selected( $settings['typography']['admin_bar']['text_transform'], 'uppercase' ); ?>>Uppercase</option>
							<option value="lowercase" <?php selected( $settings['typography']['admin_bar']['text_transform'], 'lowercase' ); ?>>Lowercase</option>
							<option value="capitalize" <?php selected( $settings['typography']['admin_bar']['text_transform'], 'capitalize' ); ?>>Capitalize</option>
						</select>
						<p class="description" id="typography-admin-bar-text-transform-desc">
							<?php esc_html_e( 'Choose text transformation for admin bar text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Admin Menu Typography -->
		<h3><?php esc_html_e( 'Admin Menu Typography', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="typography-admin-menu-font-size">
							<?php esc_html_e( 'Font Size (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="typography-admin-menu-font-size"
							name="typography[admin_menu][font_size]" 
							class="small-text mase-input mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_menu']['font_size'] ); ?>"
							min="10"
							max="32"
							step="1"
							aria-describedby="typography-admin-menu-font-size-desc"
						/>
						<p class="description" id="typography-admin-menu-font-size-desc">
							<?php esc_html_e( 'Set the font size for admin menu text (10-32 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-menu-font-weight">
							<?php esc_html_e( 'Font Weight', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-admin-menu-font-weight"
							name="typography[admin_menu][font_weight]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-admin-menu-font-weight-desc"
						>
							<option value="300" <?php selected( $settings['typography']['admin_menu']['font_weight'], 300 ); ?>>300 (Light)</option>
							<option value="400" <?php selected( $settings['typography']['admin_menu']['font_weight'], 400 ); ?>>400 (Normal)</option>
							<option value="500" <?php selected( $settings['typography']['admin_menu']['font_weight'], 500 ); ?>>500 (Medium)</option>
							<option value="600" <?php selected( $settings['typography']['admin_menu']['font_weight'], 600 ); ?>>600 (Semi-Bold)</option>
							<option value="700" <?php selected( $settings['typography']['admin_menu']['font_weight'], 700 ); ?>>700 (Bold)</option>
						</select>
						<p class="description" id="typography-admin-menu-font-weight-desc">
							<?php esc_html_e( 'Choose the font weight for admin menu text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-menu-line-height">
							<?php esc_html_e( 'Line Height', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-admin-menu-line-height"
							name="typography[admin_menu][line_height]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_menu']['line_height'] ); ?>"
							min="1.0"
							max="2.5"
							step="0.1"
							aria-describedby="typography-admin-menu-line-height-desc"
						/>
						<span class="mase-range-value" id="typography-admin-menu-line-height-value"><?php echo esc_html( $settings['typography']['admin_menu']['line_height'] ); ?></span>
						<p class="description" id="typography-admin-menu-line-height-desc">
							<?php esc_html_e( 'Adjust the line height for admin menu text (1.0-2.5).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-menu-letter-spacing">
							<?php esc_html_e( 'Letter Spacing (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-admin-menu-letter-spacing"
							name="typography[admin_menu][letter_spacing]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['admin_menu']['letter_spacing'] ); ?>"
							min="-2"
							max="5"
							step="0.5"
							aria-describedby="typography-admin-menu-letter-spacing-desc"
						/>
						<span class="mase-range-value" id="typography-admin-menu-letter-spacing-value"><?php echo esc_html( $settings['typography']['admin_menu']['letter_spacing'] ); ?>px</span>
						<p class="description" id="typography-admin-menu-letter-spacing-desc">
							<?php esc_html_e( 'Adjust the letter spacing for admin menu text (-2 to 5 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-admin-menu-text-transform">
							<?php esc_html_e( 'Text Transform', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-admin-menu-text-transform"
							name="typography[admin_menu][text_transform]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-admin-menu-text-transform-desc"
						>
							<option value="none" <?php selected( $settings['typography']['admin_menu']['text_transform'], 'none' ); ?>>None</option>
							<option value="uppercase" <?php selected( $settings['typography']['admin_menu']['text_transform'], 'uppercase' ); ?>>Uppercase</option>
							<option value="lowercase" <?php selected( $settings['typography']['admin_menu']['text_transform'], 'lowercase' ); ?>>Lowercase</option>
							<option value="capitalize" <?php selected( $settings['typography']['admin_menu']['text_transform'], 'capitalize' ); ?>>Capitalize</option>
						</select>
						<p class="description" id="typography-admin-menu-text-transform-desc">
							<?php esc_html_e( 'Choose text transformation for admin menu text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Content Typography -->
		<h3><?php esc_html_e( 'Content Typography', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="typography-content-font-size">
							<?php esc_html_e( 'Font Size (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="typography-content-font-size"
							name="typography[content][font_size]" 
							class="small-text mase-input mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['content']['font_size'] ); ?>"
							min="10"
							max="32"
							step="1"
							aria-describedby="typography-content-font-size-desc"
						/>
						<p class="description" id="typography-content-font-size-desc">
							<?php esc_html_e( 'Set the font size for content area text (10-32 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-content-font-weight">
							<?php esc_html_e( 'Font Weight', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-content-font-weight"
							name="typography[content][font_weight]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-content-font-weight-desc"
						>
							<option value="300" <?php selected( $settings['typography']['content']['font_weight'], 300 ); ?>>300 (Light)</option>
							<option value="400" <?php selected( $settings['typography']['content']['font_weight'], 400 ); ?>>400 (Normal)</option>
							<option value="500" <?php selected( $settings['typography']['content']['font_weight'], 500 ); ?>>500 (Medium)</option>
							<option value="600" <?php selected( $settings['typography']['content']['font_weight'], 600 ); ?>>600 (Semi-Bold)</option>
							<option value="700" <?php selected( $settings['typography']['content']['font_weight'], 700 ); ?>>700 (Bold)</option>
						</select>
						<p class="description" id="typography-content-font-weight-desc">
							<?php esc_html_e( 'Choose the font weight for content area text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-content-line-height">
							<?php esc_html_e( 'Line Height', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-content-line-height"
							name="typography[content][line_height]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['content']['line_height'] ); ?>"
							min="1.0"
							max="2.5"
							step="0.1"
							aria-describedby="typography-content-line-height-desc"
						/>
						<span class="mase-range-value" id="typography-content-line-height-value"><?php echo esc_html( $settings['typography']['content']['line_height'] ); ?></span>
						<p class="description" id="typography-content-line-height-desc">
							<?php esc_html_e( 'Adjust the line height for content area text (1.0-2.5).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-content-letter-spacing">
							<?php esc_html_e( 'Letter Spacing (px)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="typography-content-letter-spacing"
							name="typography[content][letter_spacing]" 
							class="mase-typography-input"
							value="<?php echo esc_attr( $settings['typography']['content']['letter_spacing'] ); ?>"
							min="-2"
							max="5"
							step="0.5"
							aria-describedby="typography-content-letter-spacing-desc"
						/>
						<span class="mase-range-value" id="typography-content-letter-spacing-value"><?php echo esc_html( $settings['typography']['content']['letter_spacing'] ); ?>px</span>
						<p class="description" id="typography-content-letter-spacing-desc">
							<?php esc_html_e( 'Adjust the letter spacing for content area text (-2 to 5 pixels).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="typography-content-text-transform">
							<?php esc_html_e( 'Text Transform', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select 
							id="typography-content-text-transform"
							name="typography[content][text_transform]" 
							class="mase-input mase-typography-input"
							aria-describedby="typography-content-text-transform-desc"
						>
							<option value="none" <?php selected( $settings['typography']['content']['text_transform'], 'none' ); ?>>None</option>
							<option value="uppercase" <?php selected( $settings['typography']['content']['text_transform'], 'uppercase' ); ?>>Uppercase</option>
							<option value="lowercase" <?php selected( $settings['typography']['content']['text_transform'], 'lowercase' ); ?>>Lowercase</option>
							<option value="capitalize" <?php selected( $settings['typography']['content']['text_transform'], 'capitalize' ); ?>>Capitalize</option>
						</select>
						<p class="description" id="typography-content-text-transform-desc">
							<?php esc_html_e( 'Choose text transformation for content area text.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
<?php include __DIR__ . '/visual-effects-section.php'; ?>
		
		<!-- Spacing Controls -->
		<h2><?php esc_html_e( 'Spacing Controls', 'modern-admin-styler' ); ?></h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label for="spacing-preset">
							<?php esc_html_e( 'Spacing Preset', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<select id="spacing-preset" name="spacing[preset]" class="mase-select mase-spacing-input">
							<option value="compact" <?php selected( $settings['spacing']['preset'] ?? 'default', 'compact' ); ?>>
								<?php esc_html_e( 'Compact', 'modern-admin-styler' ); ?>
							</option>
							<option value="default" <?php selected( $settings['spacing']['preset'] ?? 'default', 'default' ); ?>>
								<?php esc_html_e( 'Default', 'modern-admin-styler' ); ?>
							</option>
							<option value="comfortable" <?php selected( $settings['spacing']['preset'] ?? 'default', 'comfortable' ); ?>>
								<?php esc_html_e( 'Comfortable', 'modern-admin-styler' ); ?>
							</option>
							<option value="spacious" <?php selected( $settings['spacing']['preset'] ?? 'default', 'spacious' ); ?>>
								<?php esc_html_e( 'Spacious', 'modern-admin-styler' ); ?>
							</option>
							<option value="custom" <?php selected( $settings['spacing']['preset'] ?? 'default', 'custom' ); ?>>
								<?php esc_html_e( 'Custom', 'modern-admin-styler' ); ?>
							</option>
						</select>
						<p class="description">
							<strong><?php esc_html_e( 'Compact:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Minimal spacing for small screens and dense information display', 'modern-admin-styler' ); ?><br>
							<strong><?php esc_html_e( 'Default:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'WordPress standard spacing values', 'modern-admin-styler' ); ?><br>
							<strong><?php esc_html_e( 'Comfortable:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Increased spacing for better readability', 'modern-admin-styler' ); ?><br>
							<strong><?php esc_html_e( 'Spacious:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Maximum spacing for large screens and accessibility', 'modern-admin-styler' ); ?><br>
							<strong><?php esc_html_e( 'Custom:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Manually adjusted spacing values', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<?php esc_html_e( 'Visual Spacing Guides', 'modern-admin-styler' ); ?>
					</th>
					<td>
						<label class="mase-toggle-switch">
							<input 
								type="checkbox" 
								id="spacing-preview-toggle" 
								<?php checked( true ); ?>
							/>
							<span class="mase-toggle-slider"></span>
						</label>
						<p class="description">
							<?php esc_html_e( 'Show colored overlays for padding (green) and margin (orange) in live preview', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Menu Item Padding -->
		<h3><?php esc_html_e( 'Menu Item Padding', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
					</th>
					<td>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[menu_padding][unit]" 
								value="px" 
								class="mase-spacing-input mase-unit-radio"
								data-section="menu-padding"
								<?php checked( $settings['spacing']['menu_padding']['unit'] ?? 'px', 'px' ); ?>
							/>
							<span>px</span>
						</label>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[menu_padding][unit]" 
								value="rem" 
								class="mase-spacing-input mase-unit-radio"
								data-section="menu-padding"
								<?php checked( $settings['spacing']['menu_padding']['unit'] ?? 'px', 'rem' ); ?>
							/>
							<span>rem</span>
						</label>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-padding-top">
							<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-padding-top" 
							name="spacing[menu_padding][top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['top'] ?? 10 ); ?>"
							min="0" 
							max="50" 
							step="1"
							data-element="menu" 
							data-property="padding-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['top'] ?? 10 ); ?>"
							min="0" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_padding']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-padding-right">
							<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-padding-right" 
							name="spacing[menu_padding][right]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['right'] ?? 15 ); ?>"
							min="0" 
							max="50" 
							step="1"
							data-element="menu" 
							data-property="padding-right"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['right'] ?? 15 ); ?>"
							min="0" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_padding']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-padding-bottom">
							<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-padding-bottom" 
							name="spacing[menu_padding][bottom]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['bottom'] ?? 10 ); ?>"
							min="0" 
							max="50" 
							step="1"
							data-element="menu" 
							data-property="padding-bottom"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['bottom'] ?? 10 ); ?>"
							min="0" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_padding']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-padding-left">
							<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-padding-left" 
							name="spacing[menu_padding][left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['left'] ?? 15 ); ?>"
							min="0" 
							max="50" 
							step="1"
							data-element="menu" 
							data-property="padding-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_padding']['left'] ?? 15 ); ?>"
							min="0" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_padding']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Menu Item Margin -->
		<h3><?php esc_html_e( 'Menu Item Margin', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
					</th>
					<td>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[menu_margin][unit]" 
								value="px" 
								class="mase-spacing-input mase-unit-radio"
								data-section="menu-margin"
								<?php checked( $settings['spacing']['menu_margin']['unit'] ?? 'px', 'px' ); ?>
							/>
							<span>px</span>
						</label>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[menu_margin][unit]" 
								value="rem" 
								class="mase-spacing-input mase-unit-radio"
								data-section="menu-margin"
								<?php checked( $settings['spacing']['menu_margin']['unit'] ?? 'px', 'rem' ); ?>
							/>
							<span>rem</span>
						</label>
						<p class="description">
							<?php esc_html_e( 'Margins create visual spacing between menu items. Positive values add space, negative values reduce space.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-margin-top">
							<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-margin-top" 
							name="spacing[menu_margin][top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['top'] ?? 2 ); ?>"
							min="-20" 
							max="100" 
							step="1"
							data-element="menu" 
							data-property="margin-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['top'] ?? 2 ); ?>"
							min="-20" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-margin-right">
							<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-margin-right" 
							name="spacing[menu_margin][right]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['right'] ?? 0 ); ?>"
							min="-20" 
							max="100" 
							step="1"
							data-element="menu" 
							data-property="margin-right"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['right'] ?? 0 ); ?>"
							min="-20" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-margin-bottom">
							<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-margin-bottom" 
							name="spacing[menu_margin][bottom]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['bottom'] ?? 2 ); ?>"
							min="-20" 
							max="100" 
							step="1"
							data-element="menu" 
							data-property="margin-bottom"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['bottom'] ?? 2 ); ?>"
							min="-20" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="menu-margin-left">
							<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="menu-margin-left" 
							name="spacing[menu_margin][left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['left'] ?? 0 ); ?>"
							min="-20" 
							max="100" 
							step="1"
							data-element="menu" 
							data-property="margin-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['menu_margin']['left'] ?? 0 ); ?>"
							min="-20" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['menu_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Admin Bar Padding -->
		<h3><?php esc_html_e( 'Admin Bar Padding', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
					</th>
					<td>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[admin_bar_padding][unit]" 
								value="px" 
								class="mase-spacing-input mase-unit-radio"
								data-section="admin-bar-padding"
								<?php checked( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px', 'px' ); ?>
							/>
							<span>px</span>
						</label>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[admin_bar_padding][unit]" 
								value="rem" 
								class="mase-spacing-input mase-unit-radio"
								data-section="admin-bar-padding"
								<?php checked( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px', 'rem' ); ?>
							/>
							<span>rem</span>
						</label>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-padding-top">
							<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="admin-bar-padding-top" 
							name="spacing[admin_bar_padding][top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['top'] ?? 0 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="admin-bar" 
							data-property="padding-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['top'] ?? 0 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						<span class="mase-spacing-warning" style="display: none; color: #d63638; margin-left: 10px;">
							<?php esc_html_e( '⚠ Values exceeding 30px may cause layout issues', 'modern-admin-styler' ); ?>
						</span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-padding-right">
							<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="admin-bar-padding-right" 
							name="spacing[admin_bar_padding][right]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['right'] ?? 10 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="admin-bar" 
							data-property="padding-right"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['right'] ?? 10 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						<span class="mase-spacing-warning" style="display: none; color: #d63638; margin-left: 10px;">
							<?php esc_html_e( '⚠ Values exceeding 30px may cause layout issues', 'modern-admin-styler' ); ?>
						</span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-padding-bottom">
							<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="admin-bar-padding-bottom" 
							name="spacing[admin_bar_padding][bottom]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['bottom'] ?? 0 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="admin-bar" 
							data-property="padding-bottom"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['bottom'] ?? 0 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						<span class="mase-spacing-warning" style="display: none; color: #d63638; margin-left: 10px;">
							<?php esc_html_e( '⚠ Values exceeding 30px may cause layout issues', 'modern-admin-styler' ); ?>
						</span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="admin-bar-padding-left">
							<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="admin-bar-padding-left" 
							name="spacing[admin_bar_padding][left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['left'] ?? 10 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="admin-bar" 
							data-property="padding-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['admin_bar_padding']['left'] ?? 10 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						<span class="mase-spacing-warning" style="display: none; color: #d63638; margin-left: 10px;">
							<?php esc_html_e( '⚠ Values exceeding 30px may cause layout issues', 'modern-admin-styler' ); ?>
						</span>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Submenu Spacing -->
		<h3><?php esc_html_e( 'Submenu Spacing', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
					</th>
					<td>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[submenu_spacing][unit]" 
								value="px" 
								class="mase-spacing-input mase-unit-radio"
								data-section="submenu-spacing"
								<?php checked( $settings['spacing']['submenu_spacing']['unit'] ?? 'px', 'px' ); ?>
							/>
							<span>px</span>
						</label>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[submenu_spacing][unit]" 
								value="rem" 
								class="mase-spacing-input mase-unit-radio"
								data-section="submenu-spacing"
								<?php checked( $settings['spacing']['submenu_spacing']['unit'] ?? 'px', 'rem' ); ?>
							/>
							<span>rem</span>
						</label>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-padding-top">
							<?php esc_html_e( 'Padding Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-padding-top" 
							name="spacing[submenu_spacing][padding_top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_top'] ?? 8 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="submenu" 
							data-property="padding-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_top'] ?? 8 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-padding-right">
							<?php esc_html_e( 'Padding Right', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-padding-right" 
							name="spacing[submenu_spacing][padding_right]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_right'] ?? 12 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="submenu" 
							data-property="padding-right"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_right'] ?? 12 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-padding-bottom">
							<?php esc_html_e( 'Padding Bottom', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-padding-bottom" 
							name="spacing[submenu_spacing][padding_bottom]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_bottom'] ?? 8 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="submenu" 
							data-property="padding-bottom"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_bottom'] ?? 8 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-padding-left">
							<?php esc_html_e( 'Padding Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-padding-left" 
							name="spacing[submenu_spacing][padding_left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_left'] ?? 12 ); ?>"
							min="0" 
							max="30" 
							step="1"
							data-element="submenu" 
							data-property="padding-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['padding_left'] ?? 12 ); ?>"
							min="0" 
							max="30" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-margin-top">
							<?php esc_html_e( 'Margin Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-margin-top" 
							name="spacing[submenu_spacing][margin_top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['margin_top'] ?? 0 ); ?>"
							min="-10" 
							max="50" 
							step="1"
							data-element="submenu" 
							data-property="margin-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['margin_top'] ?? 0 ); ?>"
							min="-10" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="submenu-offset-left">
							<?php esc_html_e( 'Offset Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="submenu-offset-left" 
							name="spacing[submenu_spacing][offset_left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['offset_left'] ?? 0 ); ?>"
							min="-50" 
							max="50" 
							step="1"
							data-element="submenu" 
							data-property="offset-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['submenu_spacing']['offset_left'] ?? 0 ); ?>"
							min="-50" 
							max="50" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['submenu_spacing']['unit'] ?? 'px' ); ?></span>
						<span class="mase-spacing-warning" style="display: none; color: #d63638; margin-left: 10px;">
							<?php esc_html_e( '⚠ Large offset values may affect submenu alignment', 'modern-admin-styler' ); ?>
						</span>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Content Area Margin -->
		<h3><?php esc_html_e( 'Content Area Margin', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
					</th>
					<td>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[content_margin][unit]" 
								value="px" 
								class="mase-spacing-input mase-unit-radio"
								data-section="content-margin"
								<?php checked( $settings['spacing']['content_margin']['unit'] ?? 'px', 'px' ); ?>
							/>
							<span>px</span>
						</label>
						<label class="mase-unit-toggle">
							<input 
								type="radio" 
								name="spacing[content_margin][unit]" 
								value="rem" 
								class="mase-spacing-input mase-unit-radio"
								data-section="content-margin"
								<?php checked( $settings['spacing']['content_margin']['unit'] ?? 'px', 'rem' ); ?>
							/>
							<span>rem</span>
						</label>
						<p class="description">
							<?php esc_html_e( 'Adjust margins around the main content area. Ensure responsive layout integrity is maintained.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="content-margin-top">
							<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="content-margin-top" 
							name="spacing[content_margin][top]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['top'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
							data-element="content" 
							data-property="margin-top"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['top'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['content_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="content-margin-right">
							<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="content-margin-right" 
							name="spacing[content_margin][right]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['right'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
							data-element="content" 
							data-property="margin-right"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['right'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['content_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="content-margin-bottom">
							<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="content-margin-bottom" 
							name="spacing[content_margin][bottom]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['bottom'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
							data-element="content" 
							data-property="margin-bottom"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['bottom'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['content_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="content-margin-left">
							<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="range" 
							id="content-margin-left" 
							name="spacing[content_margin][left]" 
							class="mase-range mase-spacing-input"
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['left'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
							data-element="content" 
							data-property="margin-left"
						/>
						<input 
							type="number" 
							class="mase-range-number small-text" 
							value="<?php echo esc_attr( $settings['spacing']['content_margin']['left'] ?? 20 ); ?>"
							min="0" 
							max="100" 
							step="1"
						/>
						<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['content_margin']['unit'] ?? 'px' ); ?></span>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Mobile Overrides -->
		<h3><?php esc_html_e( 'Mobile Overrides', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<?php esc_html_e( 'Enable Mobile Overrides', 'modern-admin-styler' ); ?>
					</th>
					<td>
						<label class="mase-toggle-switch">
							<input 
								type="checkbox" 
								id="mobile-overrides-enabled" 
								name="spacing[mobile_overrides][enabled]"
								value="1"
								class="mase-spacing-input"
								<?php checked( $settings['spacing']['mobile_overrides']['enabled'] ?? false, true ); ?>
							/>
							<span class="mase-toggle-slider"></span>
						</label>
						<p class="description">
							<?php esc_html_e( 'Enable custom spacing values for mobile devices (below 782px). When disabled, desktop values are automatically scaled down by 25%.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<div id="mobile-overrides-section" style="<?php echo ( $settings['spacing']['mobile_overrides']['enabled'] ?? false ) ? '' : 'display: none;'; ?>">
			<!-- Mobile Menu Padding -->
			<h4><?php esc_html_e( 'Mobile Menu Padding', 'modern-admin-styler' ); ?></h4>
			<table class="form-table" role="presentation">
				<tbody>
					<tr>
						<th scope="row">
							<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
						</th>
						<td>
							<label class="mase-unit-toggle">
								<input 
									type="radio" 
									name="spacing[mobile_overrides][menu_padding][unit]" 
									value="px" 
									class="mase-spacing-input mase-unit-radio"
									data-section="mobile-menu-padding"
									<?php checked( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px', 'px' ); ?>
								/>
								<span>px</span>
							</label>
							<label class="mase-unit-toggle">
								<input 
									type="radio" 
									name="spacing[mobile_overrides][menu_padding][unit]" 
									value="rem" 
									class="mase-spacing-input mase-unit-radio"
									data-section="mobile-menu-padding"
									<?php checked( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px', 'rem' ); ?>
								/>
								<span>rem</span>
							</label>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-menu-padding-top">
								<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-menu-padding-top" 
								name="spacing[mobile_overrides][menu_padding][top]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['top'] ?? 8 ); ?>"
								min="0" 
								max="50" 
								step="1"
								data-element="mobile-menu" 
								data-property="padding-top"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['top'] ?? 8 ); ?>"
								min="0" 
								max="50" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-menu-padding-right">
								<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-menu-padding-right" 
								name="spacing[mobile_overrides][menu_padding][right]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['right'] ?? 12 ); ?>"
								min="0" 
								max="50" 
								step="1"
								data-element="mobile-menu" 
								data-property="padding-right"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['right'] ?? 12 ); ?>"
								min="0" 
								max="50" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-menu-padding-bottom">
								<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-menu-padding-bottom" 
								name="spacing[mobile_overrides][menu_padding][bottom]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['bottom'] ?? 8 ); ?>"
								min="0" 
								max="50" 
								step="1"
								data-element="mobile-menu" 
								data-property="padding-bottom"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['bottom'] ?? 8 ); ?>"
								min="0" 
								max="50" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-menu-padding-left">
								<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-menu-padding-left" 
								name="spacing[mobile_overrides][menu_padding][left]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['left'] ?? 12 ); ?>"
								min="0" 
								max="50" 
								step="1"
								data-element="mobile-menu" 
								data-property="padding-left"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['menu_padding']['left'] ?? 12 ); ?>"
								min="0" 
								max="50" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['menu_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
				</tbody>
			</table>
			
			<!-- Mobile Admin Bar Padding -->
			<h4><?php esc_html_e( 'Mobile Admin Bar Padding', 'modern-admin-styler' ); ?></h4>
			<table class="form-table" role="presentation">
				<tbody>
					<tr>
						<th scope="row">
							<label><?php esc_html_e( 'Unit', 'modern-admin-styler' ); ?></label>
						</th>
						<td>
							<label class="mase-unit-toggle">
								<input 
									type="radio" 
									name="spacing[mobile_overrides][admin_bar_padding][unit]" 
									value="px" 
									class="mase-spacing-input mase-unit-radio"
									data-section="mobile-admin-bar-padding"
									<?php checked( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px', 'px' ); ?>
								/>
								<span>px</span>
							</label>
							<label class="mase-unit-toggle">
								<input 
									type="radio" 
									name="spacing[mobile_overrides][admin_bar_padding][unit]" 
									value="rem" 
									class="mase-spacing-input mase-unit-radio"
									data-section="mobile-admin-bar-padding"
									<?php checked( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px', 'rem' ); ?>
								/>
								<span>rem</span>
							</label>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-admin-bar-padding-top">
								<?php esc_html_e( 'Top', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-admin-bar-padding-top" 
								name="spacing[mobile_overrides][admin_bar_padding][top]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['top'] ?? 0 ); ?>"
								min="0" 
								max="30" 
								step="1"
								data-element="mobile-admin-bar" 
								data-property="padding-top"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['top'] ?? 0 ); ?>"
								min="0" 
								max="30" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-admin-bar-padding-right">
								<?php esc_html_e( 'Right', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-admin-bar-padding-right" 
								name="spacing[mobile_overrides][admin_bar_padding][right]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['right'] ?? 8 ); ?>"
								min="0" 
								max="30" 
								step="1"
								data-element="mobile-admin-bar" 
								data-property="padding-right"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['right'] ?? 8 ); ?>"
								min="0" 
								max="30" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-admin-bar-padding-bottom">
								<?php esc_html_e( 'Bottom', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-admin-bar-padding-bottom" 
								name="spacing[mobile_overrides][admin_bar_padding][bottom]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['bottom'] ?? 0 ); ?>"
								min="0" 
								max="30" 
								step="1"
								data-element="mobile-admin-bar" 
								data-property="padding-bottom"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['bottom'] ?? 0 ); ?>"
								min="0" 
								max="30" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
					
					<tr>
						<th scope="row">
							<label for="mobile-admin-bar-padding-left">
								<?php esc_html_e( 'Left', 'modern-admin-styler' ); ?>
							</label>
						</th>
						<td>
							<input 
								type="range" 
								id="mobile-admin-bar-padding-left" 
								name="spacing[mobile_overrides][admin_bar_padding][left]" 
								class="mase-range mase-spacing-input"
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['left'] ?? 8 ); ?>"
								min="0" 
								max="30" 
								step="1"
								data-element="mobile-admin-bar" 
								data-property="padding-left"
							/>
							<input 
								type="number" 
								class="mase-range-number small-text" 
								value="<?php echo esc_attr( $settings['spacing']['mobile_overrides']['admin_bar_padding']['left'] ?? 8 ); ?>"
								min="0" 
								max="30" 
								step="1"
							/>
							<span class="mase-range-unit"><?php echo esc_html( $settings['spacing']['mobile_overrides']['admin_bar_padding']['unit'] ?? 'px' ); ?></span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		
		<!-- Reset and Help -->
		<h3><?php esc_html_e( 'Spacing Actions', 'modern-admin-styler' ); ?></h3>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<?php esc_html_e( 'Reset Spacing', 'modern-admin-styler' ); ?>
					</th>
					<td>
						<button type="button" id="mase-spacing-reset" class="button">
							<?php esc_html_e( 'Reset to Default Spacing', 'modern-admin-styler' ); ?>
						</button>
						<p class="description">
							<?php esc_html_e( 'Reset all spacing values to WordPress defaults. This action cannot be undone.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<?php esc_html_e( 'Optimization Tips', 'modern-admin-styler' ); ?>
						<span class="dashicons dashicons-editor-help" style="cursor: help;" title="<?php esc_attr_e( 'Click for spacing optimization tips', 'modern-admin-styler' ); ?>"></span>
					</th>
					<td>
						<div class="mase-help-content">
							<p><strong><?php esc_html_e( 'Compact Preset:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Best for small screens (laptops, tablets) and when you need to see more content at once. Ideal for power users who prefer dense information display.', 'modern-admin-styler' ); ?></p>
							
							<p><strong><?php esc_html_e( 'Default Preset:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'WordPress standard spacing. Balanced for most use cases and screen sizes. Recommended for general use.', 'modern-admin-styler' ); ?></p>
							
							<p><strong><?php esc_html_e( 'Comfortable Preset:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Increased spacing for better readability. Good for medium to large screens when you want a more relaxed interface.', 'modern-admin-styler' ); ?></p>
							
							<p><strong><?php esc_html_e( 'Spacious Preset:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Maximum spacing for large screens and accessibility needs. Provides excellent touch target sizes and clear visual separation. Recommended for users with visual impairments or touch-based devices.', 'modern-admin-styler' ); ?></p>
							
							<p><strong><?php esc_html_e( 'Touch Targets:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'For optimal touch interaction, ensure padding creates touch targets of at least 44x44 pixels. The system will warn you if values are too small.', 'modern-admin-styler' ); ?></p>
							
							<p><strong><?php esc_html_e( 'Performance:', 'modern-admin-styler' ); ?></strong> <?php esc_html_e( 'Using rem units instead of px can improve scalability and accessibility. The system automatically converts between units while maintaining visual consistency.', 'modern-admin-styler' ); ?></p>
						</div>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<?php esc_html_e( 'Accessibility Warnings', 'modern-admin-styler' ); ?>
					</th>
					<td>
						<div id="mase-accessibility-warnings" class="mase-warnings-container" style="display: none;">
							<!-- Warnings will be dynamically inserted here by JavaScript -->
						</div>
						<p class="description">
							<?php esc_html_e( 'Accessibility warnings will appear here if your spacing values may cause usability issues.', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<!-- Performance Settings -->
		<h2><?php esc_html_e( 'Performance Settings', 'modern-admin-styler' ); ?></h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">
						<?php esc_html_e( 'CSS Minification', 'modern-admin-styler' ); ?>
					</th>
					<td>
						<fieldset>
							<label for="enable-minification">
								<input 
									type="checkbox" 
									id="enable-minification"
									name="performance[enable_minification]" 
									value="1"
									<?php checked( $settings['performance']['enable_minification'], true ); ?>
								/>
								<?php esc_html_e( 'Enable CSS minification for better performance', 'modern-admin-styler' ); ?>
							</label>
						</fieldset>
					</td>
				</tr>
				
				<tr>
					<th scope="row">
						<label for="cache-duration">
							<?php esc_html_e( 'Cache Duration (seconds)', 'modern-admin-styler' ); ?>
						</label>
					</th>
					<td>
						<input 
							type="number" 
							id="cache-duration"
							name="performance[cache_duration]" 
							class="small-text"
							value="<?php echo esc_attr( $settings['performance']['cache_duration'] ); ?>"
							min="300"
							max="86400"
							aria-describedby="cache-duration-desc"
						/>
						<p class="description" id="cache-duration-desc">
							<?php esc_html_e( 'How long to cache generated CSS (300-86400 seconds, 5 minutes to 24 hours).', 'modern-admin-styler' ); ?>
						</p>
					</td>
				</tr>
			</tbody>
		</table>
		
		<?php submit_button( __( 'Save Settings', 'modern-admin-styler' ) ); ?>
	</form>
	
	<!-- Import/Export Section -->
	<h2><?php esc_html_e( 'Import / Export Settings', 'modern-admin-styler' ); ?></h2>
	<div class="mase-import-export">
		<div class="mase-export-section">
			<h3><?php esc_html_e( 'Export Settings', 'modern-admin-styler' ); ?></h3>
			<p class="description"><?php esc_html_e( 'Export your current settings to a JSON file. You can use this to backup your settings or share them with other sites.', 'modern-admin-styler' ); ?></p>
			<button type="button" id="mase-export-btn" class="button button-secondary">
				<?php esc_html_e( 'Export Settings', 'modern-admin-styler' ); ?>
			</button>
		</div>
		
		<div class="mase-import-section">
			<h3><?php esc_html_e( 'Import Settings', 'modern-admin-styler' ); ?></h3>
			<p class="description"><?php esc_html_e( 'Import settings from a previously exported JSON file. This will overwrite your current settings.', 'modern-admin-styler' ); ?></p>
			<input type="file" id="mase-import-file" accept=".json" style="display: none;" />
			<button type="button" id="mase-import-btn" class="button button-secondary">
				<?php esc_html_e( 'Import Settings', 'modern-admin-styler' ); ?>
			</button>
		</div>
	</div>
	
	<div id="mase-notices"></div>
</div>
