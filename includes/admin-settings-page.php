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
	
	<div id="mase-notices"></div>
</div>
